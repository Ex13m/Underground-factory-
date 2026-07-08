/**
 * Серверная генерация картинок для арт-редактора (автономность сайта).
 * Ключ Replicate живёт в переменной окружения Netlify (REPLICATE_API_TOKEN) —
 * в браузер он не попадает. Функция принимает промпт, зовёт Replicate
 * (flux-schnell: быстрый и дешёвый) и отдаёт САМИ БАЙТЫ картинки —
 * клиент получает blob со своего же домена, без CORS-приключений.
 *
 * Настройка: Netlify → Site configuration → Environment variables →
 * REPLICATE_API_TOKEN = r8_… (получить на replicate.com/account/api-tokens).
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

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('POST only', { status: 405 });
  }
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    // ключ не настроен — клиент откатится на бесплатный генератор
    return Response.json({ error: 'NO_SERVER_KEY' }, { status: 501 });
  }

  let body: { prompt?: string; width?: number; height?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'bad json' }, { status: 400 });
  }
  const prompt = (body.prompt ?? '').slice(0, 4000);
  if (!prompt.trim()) return Response.json({ error: 'empty prompt' }, { status: 400 });

  // Prefer: wait — Replicate держит соединение до готовности (flux-schnell ~2-4 с)
  const r = await fetch(
    'https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'wait',
      },
      body: JSON.stringify({
        input: {
          prompt,
          aspect_ratio: pickAspect(body.width ?? 4, body.height ?? 3),
          output_format: 'jpg',
          output_quality: 85,
        },
      }),
    },
  );
  const data = await r.json();
  const url: string | undefined = Array.isArray(data?.output) ? data.output[0] : data?.output;
  if (!r.ok || !url) {
    return Response.json({ error: data?.detail ?? data?.error ?? `replicate ${r.status}` }, { status: 502 });
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
