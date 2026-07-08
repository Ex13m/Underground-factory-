/**
 * Серверная очередь заявок на генерацию (Higgsfield).
 * Кнопка «Заказать ▸ Higgsfield» на сайте шлёт заявку сюда (Netlify Blobs) —
 * пользователю НИЧЕГО не нужно скачивать: Claude в терминале забирает очередь
 * простым GET https://<сайт>/api/queue, исполняет и чистит DELETE'ом.
 */

import { getStore } from '@netlify/blobs';

interface Ticket {
  key: string;
  kind: 'image' | 'video';
  prompt: string;
  width: number;
  height: number;
  createdAt: number;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export default async (req: Request) => {
  const store = getStore('uf-gen-queue');
  const read = async (): Promise<Ticket[]> => {
    try {
      return JSON.parse((await store.get('tickets')) ?? '[]') as Ticket[];
    } catch {
      return [];
    }
  };

  if (req.method === 'GET') {
    return json(await read());
  }

  if (req.method === 'POST') {
    let t: Ticket;
    try {
      t = await req.json();
    } catch {
      return json({ error: 'bad json' }, 400);
    }
    if (!t?.key || !t?.prompt) return json({ error: 'key and prompt required' }, 400);
    // одна актуальная заявка на объект; общий лимит — защита от спама
    const list = (await read()).filter((x) => x.key !== t.key).slice(-49);
    list.push({
      key: String(t.key).slice(0, 200),
      kind: t.kind === 'video' ? 'video' : 'image',
      prompt: String(t.prompt).slice(0, 4000),
      width: Number(t.width) || 800,
      height: Number(t.height) || 500,
      createdAt: Date.now(),
    });
    await store.set('tickets', JSON.stringify(list));
    return json({ ok: true, count: list.length });
  }

  if (req.method === 'DELETE') {
    await store.set('tickets', '[]');
    return json({ ok: true });
  }

  return new Response('GET, POST or DELETE', { status: 405 });
};

export const config = { path: '/api/queue' };
