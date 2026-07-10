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

/** размер для gpt-image-1: у него фиксированная сетка размеров */
function gptSize(w: number, h: number): string {
  const r = w / Math.max(1, h);
  if (r > 1.15) return '1536x1024';
  if (r < 0.87) return '1024x1536';
  return '1024x1024';
}

const MODELS: Record<string, string> = {
  free: 'black-forest-labs/flux-schnell',
  nano: 'google/nano-banana',
  gpt: 'openai/gpt-image-1',
  recraft: 'recraft-ai/recraft-v3',
  fluxpro: 'black-forest-labs/flux-1.1-pro',
  seedream: 'bytedance/seedream-4',
};

/** vision-модели для «Опознать по фото» (первая доступная на ключе) */
const DESCRIBE_MODELS = ['openai/gpt-4o-mini', 'openai/gpt-4o'];

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
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'bad json' }, { status: 400 });
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
      `body shape, headlights, grille, proportions, stance, wheels, era-correct details. Consistency is the top priority.\n` +
      `2. The car is a tastefully tuned version with an aftermarket body kit (carbon fiber details), but the body must stay honest and recognizable.\n` +
      (cp.userPrompt?.trim()
        ? `3. The user's request is LAW — build the scene and mood around it, keep every user detail: "${cp.userPrompt.trim()}".\n`
        : `3. Pick ONE believable real street location (not a garage), vary it.\n`) +
      `4. Always: ultra realistic professional photography, shot on a pro camera, true-to-life paint and reflections, no CGI look, no text.\n` +
      (cp.style
        ? `5. Add a subtle color grade only: deep blacks, slightly desaturated dirty-white highlights, an occasional blood-red (#e01b22) accent. Fine film grain.\n`
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

  const input: Record<string, unknown> =
    modelKey === 'gpt'
      ? { prompt, size: gptSize(body.width ?? 4, body.height ?? 3), quality: 'medium', ...(refs.length ? { input_images: refs } : {}) }
      : modelKey === 'nano'
        ? { prompt, aspect_ratio: aspect, output_format: 'jpg', ...(refs.length ? { image_input: refs } : {}) }
        : modelKey === 'seedream'
          ? { prompt, aspect_ratio: aspect, ...(refs.length ? { image_input: refs } : {}) }
          : modelKey === 'fluxpro'
            ? { prompt, aspect_ratio: aspect, output_format: 'jpg', ...(refs.length ? { image_prompt: refs[0] } : {}) }
            : modelKey === 'recraft'
              ? {
                  prompt,
                  size:
                    (body.width ?? 4) / Math.max(1, body.height ?? 3) > 1.15
                      ? '1820x1024'
                      : (body.width ?? 4) / Math.max(1, body.height ?? 3) < 0.87
                        ? '1024x1820'
                        : '1024x1024',
                }
              : { prompt, aspect_ratio: aspect, output_format: 'jpg', output_quality: 85 };

  // Prefer: wait — Replicate держит соединение до готовности
  const r = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'wait',
    },
    body: JSON.stringify({ input }),
  });
  const data = await r.json();
  const url: string | undefined = Array.isArray(data?.output) ? data.output[0] : data?.output;
  if (!r.ok || !url) {
    return Response.json(
      { error: data?.detail ?? data?.error ?? `replicate ${r.status}` },
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
