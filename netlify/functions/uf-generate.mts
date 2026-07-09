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
};

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

  let body: { prompt?: string; width?: number; height?: number; model?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'bad json' }, { status: 400 });
  }
  const prompt = (body.prompt ?? '').slice(0, 4000);
  if (!prompt.trim()) return Response.json({ error: 'empty prompt' }, { status: 400 });

  const modelKey = body.model && MODELS[body.model] ? body.model : 'free';
  const model = MODELS[modelKey];
  const input: Record<string, unknown> =
    modelKey === 'gpt'
      ? { prompt, size: gptSize(body.width ?? 4, body.height ?? 3), quality: 'medium' }
      : modelKey === 'nano'
        ? { prompt, aspect_ratio: pickAspect(body.width ?? 4, body.height ?? 3), output_format: 'jpg' }
        : {
            prompt,
            aspect_ratio: pickAspect(body.width ?? 4, body.height ?? 3),
            output_format: 'jpg',
            output_quality: 85,
          };

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
