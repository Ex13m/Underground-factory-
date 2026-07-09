/**
 * Файловый мост админки (Netlify Blobs, store 'uf-tracks'):
 * - треки радио (Админка → РАДИО → «Загрузить MP3», заявка add-track);
 * - фото-референсы своих тачек для рилсов (Контент → «Своя тачка», reelref-*.jpg).
 * Claude в терминале забирает файл GET /api/track?name=... при исполнении заявки.
 * - POST { name, dataBase64 } — сохранить (>4.5 МБ — честный отказ 413);
 * - GET ?name=<имя>           — отдать файл (Content-Type по расширению);
 * - GET                        — список имён;
 * - DELETE                     — очистить хранилище (после разбора очереди).
 */

import { getStore } from '@netlify/blobs';

const MAX_BYTES = Math.floor(4.5 * 1024 * 1024);

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** имя файла без сюрпризов: буквы/цифры/точка/дефис/подчёркивание */
const safeName = (n: string) => String(n).replace(/[^\w.\-]+/g, '_').slice(0, 120);

export default async (req: Request) => {
  const store = getStore('uf-tracks');
  const url = new URL(req.url);

  if (req.method === 'GET') {
    const name = url.searchParams.get('name');
    if (!name) {
      const { blobs } = await store.list();
      return json(blobs.map((b) => b.key));
    }
    const key = safeName(name);
    const buf = await store.get(key, { type: 'arrayBuffer' });
    if (!buf) return json({ error: 'not found' }, 404);
    const type = key.endsWith('.jpg') || key.endsWith('.jpeg')
      ? 'image/jpeg'
      : key.endsWith('.png')
        ? 'image/png'
        : 'audio/mpeg';
    return new Response(buf, {
      headers: {
        'Content-Type': type,
        'Content-Disposition': `attachment; filename="${key}"`,
      },
    });
  }

  if (req.method === 'POST') {
    let body: { name?: string; dataBase64?: string };
    try {
      body = await req.json();
    } catch {
      return json({ error: 'bad json' }, 400);
    }
    const { name, dataBase64 } = body ?? {};
    if (!name || !dataBase64) return json({ error: 'name and dataBase64 required' }, 400);
    // прикидка размера до декодирования: base64 → ~3/4 байт
    const approx = Math.floor(dataBase64.length * 0.75);
    if (approx > MAX_BYTES) {
      return json(
        {
          error: `file too large: ~${(approx / 1048576).toFixed(1)} MB, limit 4.5 MB`,
          hint: 'передай файл Claude в чате — он добавит трек в репозиторий напрямую',
        },
        413,
      );
    }
    let bytes: Buffer;
    try {
      bytes = Buffer.from(dataBase64, 'base64');
    } catch {
      return json({ error: 'bad base64' }, 400);
    }
    if (bytes.byteLength > MAX_BYTES) {
      return json({ error: 'file too large, limit 4.5 MB' }, 413);
    }
    const key = safeName(name);
    const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    await store.set(key, ab);
    return json({ ok: true, name: key, bytes: bytes.byteLength });
  }

  if (req.method === 'DELETE') {
    const { blobs } = await store.list();
    await Promise.all(blobs.map((b) => store.delete(b.key)));
    return json({ ok: true, removed: blobs.length });
  }

  return new Response('GET, POST or DELETE', { status: 405 });
};

export const config = { path: '/api/track' };
