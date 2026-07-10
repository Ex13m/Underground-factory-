/**
 * Серверная генерация картинок для арт-редактора (автономность сайта).
 * Модели Replicate:
 *  - free ▸ black-forest-labs/flux-schnell (быстро и почти даром);
 *  - nano ▸ google/nano-banana (Nano Banana);
 *  - gpt  ▸ openai/gpt-image-1 (GPT Image).
 * Ключ берётся из заголовка X-Replicate-Key (поле в арт-редакторе, хранится
 * в браузере админа) или из переменной окружения Netlify REPLICATE_API_TOKEN.
 * Функция отдаёт САМИ БАЙТЫ картинки — клиент получает blob со своего же
 * домена, без CORS-приключений (Replicate напрямую браузер не пускает).
 *
 * GET ?ping=1 — проверка ключа (200 = рабочий), для кнопки «ТЕСТ» на сайте.
 * Постоянная настройка: Netlify → Environment variables →
 * REPLICATE_API_TOKEN = r8_… (replicate.com/account/api-tokens).
 */

const ASPECTS: Array<[string, number]> = [
  ['21:9', 21 / 9], ['16:9', 16 / 9], ['3:2', 1.5], ['4:3', 4 / 3],
  ['1:1', 1], ['3:4', 0.75], ['2:3', 2 / 3], ['9:16', 9 / 16],
];

function pickAspect(w: number, h: number): string {
  const r = w / Math.max(1, h);
  let best = ASPECTS[0];
  for (const a of ASPECTS) if (Math.abs(a[1] - r) < Math.abs(best[1] - r)) best = a;
  return best[0];
}

/** формат для gpt-image-2: он принимает только 1:1 / 3:2 / 2:3 */
function gptAspect(w: number, h: number): string {
  const r = w / Math.max(1, h);
  if (r > 1.15) return '3:2';
  if (r < 0.87) return '2:3';
  return '1:1';
}

// ПОСЛЕДНИЕ версии моделей (заказ владельца; слаги сверены с базой 2026-07)
const MODELS: Record<string, string> = {
  free: 'black-forest-labs/flux-schnell',
  nano: 'google/nano-banana-2',
  // gpt-image-1 требует СВОЙ ключ OpenAI (BYOK) и с одним r8_ не работает;
  // gpt-image-2 ходит по обычному биллингу Replicate
  gpt: 'openai/gpt-image-2',
  recraft: 'recraft-ai/recraft-v4',
  fluxpro: 'black-forest-labs/flux-2-pro',
  seedream: 'bytedance/seedream-4.5',
};

/** vision-модели для «Опознать по фото» (первая доступная на ключе) */
const DESCRIBE_MODELS = ['openai/gpt-4o-mini', 'openai/gpt-4o'];

/** банк ракурсов: тачки не должны выходить одной и той же изометрией */
const CAR_ANGLES = [
  'low front three-quarter with a wide lens, bumper level',
  'rear three-quarter from low, taillights prominent',
  'dead-on front view at bumper height',
  'true side profile with a panning-shot feel',
  'high angle looking slightly down over the roofline',
  'close over the front fender, looking down the body line',
  'long-lens compression from across the street, foreground passers-by',
  'from knee height behind the rear wheel, kit in the foreground',
];

export default async (req: Request) => {
  const token = req.headers.get('x-replicate-key')?.trim() || process.env.REPLICATE_API_TOKEN;

  // проверка ключа для кнопки «ТЕСТ»
  if (req.method === 'GET') {
    if (!new URL(req.url).searchParams.get('ping')) return new Response('POST or GET ?ping=1', { status: 405 });
    if (!token) return Response.json({ ok: false, error: 'NO_KEY' }, { status: 501 });
    const acc = await fetch('https://api.replicate.com/v1/account', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return Response.json({ ok: acc.ok }, { status: acc.ok ? 200 : 401 });
  }

  if (req.method !== 'POST') {
    return new Response('POST only', { status: 405 });
  }
  if (!token) {
    // ключа нет нигде — клиент откатится на бесплатный генератор
    return Response.json({ error: 'NO_SERVER_KEY' }, { status: 501 });
  }

  let body: {
    prompt?: string;
    width?: number;
    height?: number;
    model?: string;
    /** референсы (data URI jpeg) — для моделей с image-входом */
    references?: string[];
    /** режим «Опознать по фото»: вернуть JSON {name, passport} по картинке */
    describe?: string;
    /** арт-агент: собрать детальный промпт под КОНКРЕТНУЮ тачку (консистентность) */
    carPrompt?: { car: string; userPrompt?: string; style?: boolean };
    /** улучшатель кастомных промптов: сырой промпт → сильный детальный.
        mode 'image' (по умолчанию) — фото-промпт по-английски;
        mode 'scenario' — сценарий рилса, язык пользователя сохраняется */
    enhance?: { prompt: string; car?: string; style?: boolean; mode?: 'image' | 'scenario' };
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'bad json' }, { status: 400 });
  }

  // ---- улучшатель кастомных промптов: сырой промпт → сильный детальный ----
  // Каждый замысел пользователя — закон: агент только обогащает (композиция,
  // оптика, свет, материалы, среда), ничего не выкидывая и не подменяя.
  if (body.enhance?.prompt?.trim()) {
    const en = body.enhance;
    const ask =
      en.mode === 'scenario'
        ? `You are the creative director of an underground tuning shop. ` +
          `Rewrite the user's raw short-video (reel) brief into ONE richly detailed scenario IN THE SAME LANGUAGE the user wrote in.\n` +
          `Rules:\n` +
          `1. EVERY user intent and detail is LAW — keep them all; only enrich: concrete scenes and beats, camera moves, environment, crowd/era details, mood, pacing.\n` +
          (en.car ? `2. The hero car is exactly: "${en.car}" — keep it consistent through every scene.\n` : '') +
          `3. Keep it compact enough for a ~30s reel (5-6 scenes).\n` +
          `User's raw brief: "${String(en.prompt).slice(0, 1500)}"\n` +
          `Reply STRICTLY with one JSON object: {"prompt":"..."}`
        : `You are the art director of an underground tuning shop website. ` +
          `Rewrite the user's raw image prompt into ONE powerful, richly detailed English image-generation prompt.\n` +
          `Rules:\n` +
          `1. EVERY user intent and detail is LAW — keep them all; only enrich: composition, lens and camera angle, light, materials, believable environment details, mood.\n` +
          (en.car
            ? `2. The subject is this exact car: "${en.car}" — identify the exact generation and weave its precise body details in (headlights, grille, proportions, wheels) so any model draws the same car.\n`
            : '') +
          `3. Always: ultra realistic professional photography, shot on a pro camera, true-to-life materials and reflections, no CGI look, no text on the image.\n` +
          (en.style
            ? `4. Subtle color grade only: deep blacks, slightly desaturated dirty-white highlights, an occasional blood-red (#e01b22) accent, fine film grain.\n`
            : '') +
          `User's raw prompt: "${String(en.prompt).slice(0, 1500)}"\n` +
          `Reply STRICTLY with one JSON object: {"prompt":"..."}`;
    for (const m of DESCRIBE_MODELS) {
      const er = await fetch(`https://api.replicate.com/v1/models/${m}/predictions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'wait' },
        body: JSON.stringify({ input: { prompt: ask } }),
      });
      const ed = await er.json().catch(() => ({}));
      if (er.status === 404 || er.status === 422) continue;
      const text = Array.isArray(ed?.output) ? ed.output.join('') : String(ed?.output ?? '');
      const jm = text.match(/\{[\s\S]*\}/);
      if (er.ok && jm) {
        try {
          return Response.json(JSON.parse(jm[0]));
        } catch { /* кривой JSON — ошибка ниже */ }
      }
      return Response.json({ error: ed?.detail ?? ed?.error ?? `replicate ${er.status}` }, { status: 502 });
    }
    return Response.json({ error: 'no text model available on this key' }, { status: 502 });
  }

  // ---- арт-агент промптов: имя тачки → детальный фото-промпт ----
  // Агент знает конкретное поколение (кузов, оптика, решётка, пропорции) и
  // расписывает его дословно, чтобы ЛЮБАЯ модель нарисовала ту же машину.
  if (body.carPrompt?.car) {
    const cp = body.carPrompt;
    const ask =
      `You are the art director of an underground tuning shop website. ` +
      `Write ONE image-generation prompt in English for this exact car: "${cp.car}".\n` +
      `Rules:\n` +
      `1. IDENTIFY the exact generation and describe its body PRECISELY so any image model draws THE SAME car: ` +
      `body shape, headlights, grille, proportions, stance, wheels, era-correct details. Consistency of the car identity is the top priority.\n` +
      (cp.userPrompt?.trim()
        ? `2. The user's request is LAW and OVERRIDES everything except the car identity: "${cp.userPrompt.trim()}". ` +
          `If it changes the car (body kit, color, materials, parts), the prompt MUST state those changes explicitly and forcefully ` +
          `(e.g. "the ENTIRE body kit is replaced with exposed RED carbon fiber aero parts") — the modification must be clearly visible, ` +
          `not a subtle hint. Build the scene and mood around the user's request, keep every user detail.\n`
        : `2. The car is a tastefully tuned version with an aftermarket carbon fiber body kit, body honest and recognizable. ` +
          `Pick ONE believable real street location (not a garage), vary it.\n`) +
      `3. If reference photos are used, add one sentence: requested modifications OVERRIDE the reference appearance; ` +
      `the reference is only for the car identity and proportions.\n` +
      `4. CAMERA ANGLE MUST BE: "${CAR_ANGLES[Math.floor(Math.random() * CAR_ANGLES.length)]}" — ` +
      `never the default three-quarter isometric view, and do NOT copy the reference photo's angle ` +
      `(unless the user explicitly asked for a specific angle — then the user wins).\n` +
      `5. Always: ultra realistic professional photography, shot on a pro camera, true-to-life paint and reflections, no CGI look, no text.\n` +
      (cp.style
        ? `6. Add a subtle color grade only: deep blacks, slightly desaturated dirty-white highlights, an occasional blood-red (#e01b22) accent. Fine film grain.\n`
        : '') +
      `Reply STRICTLY with one JSON object: {"prompt":"..."}`;
    for (const m of DESCRIBE_MODELS) {
      const ar = await fetch(`https://api.replicate.com/v1/models/${m}/predictions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'wait' },
        body: JSON.stringify({ input: { prompt: ask } }),
      });
      const ad = await ar.json().catch(() => ({}));
      if (ar.status === 404 || ar.status === 422) continue; // модель недоступна — следующая
      const text = Array.isArray(ad?.output) ? ad.output.join('') : String(ad?.output ?? '');
      const jm = text.match(/\{[\s\S]*\}/);
      if (ar.ok && jm) {
        try {
          return Response.json(JSON.parse(jm[0]));
        } catch { /* кривой JSON — отдаём ошибку ниже */ }
      }
      return Response.json({ error: ad?.detail ?? ad?.error ?? `replicate ${ar.status}` }, { status: 502 });
    }
    return Response.json({ error: 'no text model available on this key' }, { status: 502 });
  }

  // ---- «Опознать по фото»: vision-модель описывает тачку ----
  if (body.describe) {
    const ask =
      'Identify the car in the photo. Reply STRICTLY with one JSON object, no explanations: ' +
      '{"name":"Make Model (generation or years)","passport":"короткий паспорт машины ПО-РУССКИ в дерзком стиле андеграунд-гаража: цвет, кузов, диски, характерные детали — одна-две фразы"}';
    for (const m of DESCRIBE_MODELS) {
      const dr = await fetch(`https://api.replicate.com/v1/models/${m}/predictions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'wait' },
        body: JSON.stringify({ input: { prompt: ask, image_input: [body.describe] } }),
      });
      const dd = await dr.json().catch(() => ({}));
      if (dr.status === 404 || dr.status === 422) continue; // модель недоступна — следующая
      const text = Array.isArray(dd?.output) ? dd.output.join('') : String(dd?.output ?? '');
      const jm = text.match(/\{[\s\S]*\}/);
      if (dr.ok && jm) return Response.json(JSON.parse(jm[0]));
      return Response.json({ error: dd?.detail ?? dd?.error ?? `replicate ${dr.status}` }, { status: 502 });
    }
    return Response.json({ error: 'no vision model available on this key' }, { status: 502 });
  }

  const prompt = (body.prompt ?? '').slice(0, 4000);
  if (!prompt.trim()) return Response.json({ error: 'empty prompt' }, { status: 400 });

  const modelKey = body.model && MODELS[body.model] ? body.model : 'free';
  const model = MODELS[modelKey];
  const aspect = pickAspect(body.width ?? 4, body.height ?? 3);
  // референсы: data URI, максимум 3 (Replicate принимает data URI в файловых полях)
  const refs = (body.references ?? []).filter((r) => typeof r === 'string' && r.startsWith('data:image/')).slice(0, 3);
  // референс не должен глушить промпт: правки пользователя сильнее фото
  const prompt2 = refs.length
    ? `${prompt}\n\nUse the reference image(s) ONLY for the car identity and proportions. Any modifications described above (body kit, color, materials, parts) OVERRIDE the reference appearance and must be clearly visible.`
    : prompt;

  // ЛЕСЕНКА вариантов input: имена полей референсов у моделей меняются между
  // версиями — на 422 (кривое поле) пробуем следующий вариант, последним
  // всегда идёт чистый text-to-image, чтобы кнопка не «молчала» никогда.
  const size43 =
    (body.width ?? 4) / Math.max(1, body.height ?? 3) > 1.15
      ? '1820x1024'
      : (body.width ?? 4) / Math.max(1, body.height ?? 3) < 0.87
        ? '1024x1820'
        : '1024x1024';
  const candidates: Array<Record<string, unknown>> = [];
  if (modelKey === 'gpt') {
    const base = { prompt: prompt2, aspect_ratio: gptAspect(body.width ?? 4, body.height ?? 3), quality: 'high', output_format: 'jpeg' };
    if (refs.length) candidates.push({ ...base, input_images: refs }, { ...base, image_input: refs });
    candidates.push(base);
  } else if (modelKey === 'nano' || modelKey === 'seedream') {
    const base = { prompt: prompt2, aspect_ratio: aspect, output_format: 'jpg' };
    if (refs.length) candidates.push({ ...base, image_input: refs }, { ...base, input_images: refs });
    candidates.push(base);
  } else if (modelKey === 'fluxpro') {
    const base = { prompt: prompt2, aspect_ratio: aspect, output_format: 'jpg' };
    if (refs.length) candidates.push({ ...base, input_images: refs }, { ...base, image_input: refs }, { ...base, image_prompt: refs[0] });
    candidates.push(base);
  } else if (modelKey === 'recraft') {
    candidates.push({ prompt, size: size43 }, { prompt });
  } else {
    candidates.push({ prompt, aspect_ratio: aspect, output_format: 'jpg', output_quality: 85 });
  }

  // Prefer: wait — Replicate держит соединение до готовности
  let data: any = null;
  let status = 0;
  let url: string | undefined;
  for (const input of candidates) {
    const r = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'wait',
      },
      body: JSON.stringify({ input }),
    });
    data = await r.json().catch(() => ({}));
    status = r.status;
    url = Array.isArray(data?.output) ? data.output[0] : data?.output;
    if (r.ok && url) break;
    // 422 = модель не приняла форму input — пробуем следующий вариант
    if (r.status !== 422) break;
    url = undefined;
  }
  if (!url) {
    return Response.json(
      { error: data?.detail ?? data?.error ?? `replicate ${status}` },
      { status: 502 },
    );
  }

  // проксируем байты картинки клиенту (same-origin)
  const img = await fetch(url);
  if (!img.ok || !img.body) {
    return Response.json({ error: `image fetch ${img.status}` }, { status: 502 });
  }
  return new Response(img.body, {
    headers: {
      'Content-Type': img.headers.get('content-type') ?? 'image/jpeg',
      'Cache-Control': 'no-store',
    },
  });
};

export const config = { path: '/api/generate' };
