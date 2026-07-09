/**
 * Серверный ящик обратной связи «Пит-босса» (Netlify Blobs).
 * Бот шлёт сюда сообщения пользователей и непонятые вопросы (префикс 'unanswered: '):
 * POST /api/feedback — принять запись, GET — прочитать список, DELETE — очистить.
 */

import { getStore } from '@netlify/blobs';

interface Feedback {
  message: string;
  contact?: string;
  page?: string;
  createdAt: number;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export default async (req: Request) => {
  const store = getStore('uf-feedback');
  const read = async (): Promise<Feedback[]> => {
    try {
      return JSON.parse((await store.get('entries')) ?? '[]') as Feedback[];
    } catch {
      return [];
    }
  };

  if (req.method === 'GET') {
    return json(await read());
  }

  if (req.method === 'POST') {
    let f: Feedback;
    try {
      f = await req.json();
    } catch {
      return json({ error: 'bad json' }, 400);
    }
    const message = String(f?.message ?? '').trim().slice(0, 2000);
    if (!message) return json({ error: 'message required' }, 400);
    // лимит списка — защита от спама
    const list = (await read()).slice(-199);
    const entry: Feedback = {
      message,
      createdAt: Number(f.createdAt) || Date.now(),
    };
    if (f.contact) entry.contact = String(f.contact).slice(0, 200);
    if (f.page) entry.page = String(f.page).slice(0, 200);
    list.push(entry);
    await store.set('entries', JSON.stringify(list));
    return json({ ok: true, count: list.length });
  }

  if (req.method === 'DELETE') {
    await store.set('entries', '[]');
    return json({ ok: true });
  }

  return new Response('GET, POST or DELETE', { status: 405 });
};

export const config = { path: '/api/feedback' };
