/**
 * Полка готовых рилсов (Админка → КОНТЕНТ). Заполняет Claude в терминале
 * при исполнении заявок kind:'reel' из /api/queue: готовый файл кладётся
 * в public/media/reels/, сюда добавляется запись { file, title, createdAt }.
 */

import type { LocalText } from '../lib/types';

export interface Reel {
  /** путь к файлу, например '/media/reels/silvia-drift.mp4' (9:16) */
  file: string;
  title: LocalText;
  /** дата производства, ISO 'YYYY-MM-DD' */
  createdAt: string;
}

export const REELS: Reel[] = [];
