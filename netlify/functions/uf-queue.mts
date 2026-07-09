/**
 * Серверная очередь заявок на генерацию (Higgsfield).
 * Кнопка «Заказать ▸ Higgsfield» на сайте шлёт заявку сюда (Netlify Blobs) —
 * пользователю НИЧЕГО не нужно скачивать: Claude в терминале забирает очередь
 * простым GET https://<сайт>/api/queue, исполняет и чистит DELETE'ом.
 */

import { getStore } from '@netlify/blobs';

interface Ticket {
  key: string;
  /**
   * scrap-video — пометка «брак» из админки (вкладка ЭФИР): ролик удалить из репозитория;
   * trim-video — физически обрезать ролик до отрезка [start, end] (видеоредактор ЭФИРа);
   * add-track — загруженный mp3 забрать из /api/track и добавить в public/media/music;
   * trim-audio — обрезать трек насовсем; stems-audio — разложить на стемы (вкладка РАДИО);
   * reel — заказ рилса контент-завода (вкладка КОНТЕНТ): в prompt — JSON с параметрами.
   */
  kind: 'image' | 'video' | 'scrap-video' | 'trim-video' | 'add-track' | 'trim-audio' | 'stems-audio' | 'reel';
  prompt: string;
  width: number;
  height: number;
  /** только для trim-video/trim-audio: границы отрезка в секундах */
  start?: number;
  end?: number;
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
      kind:
        t.kind === 'video' || t.kind === 'scrap-video' || t.kind === 'trim-video' ||
        t.kind === 'add-track' || t.kind === 'trim-audio' || t.kind === 'stems-audio' ||
        t.kind === 'reel'
          ? t.kind
          : 'image',
      prompt: String(t.prompt).slice(0, 4000),
      width: Number(t.width) || 800,
      height: Number(t.height) || 500,
      // для обрезки (видео и аудио) пропускаем числовые границы отрезка
      ...(t.kind === 'trim-video' || t.kind === 'trim-audio'
        ? { start: Number(t.start) || 0, end: Number(t.end) || 0 }
        : {}),
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
