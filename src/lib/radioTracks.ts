/**
 * Треки радио: сид-плейлист (data/playlist) + загруженные админом mp3
 * (mediaStore, kind='audio', ключ `audio:<имя файла>`). id трека = имя файла —
 * на него завязаны onAir/first/trims/trackGain в store/radio.
 * Используют fx/MicroPlayer и Админка → РАДИО.
 */

import { PLAYLIST } from '../data/playlist';
import { listOverrides } from './mediaStore';
import { isOnAir } from '../store/radio';

/** префикс ключа аудио-оверрайдов в mediaStore */
export const AUDIO_PREFIX = 'audio:';

export interface RadioTrack {
  id: string;
  title: string;
  url: string;
  uploaded: boolean;
}

export function seedTracks(): RadioTrack[] {
  return PLAYLIST.map((t) => ({
    id: t.url.split('/').pop() ?? t.url,
    title: t.title,
    url: t.url,
    uploaded: false,
  }));
}

export function uploadedTracks(): RadioTrack[] {
  return listOverrides()
    .filter((o) => o.kind === 'audio' && o.key.startsWith(AUDIO_PREFIX))
    .map((o) => {
      const id = o.key.slice(AUDIO_PREFIX.length);
      return {
        id,
        title: id.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').toUpperCase(),
        url: o.url,
        uploaded: true,
      };
    });
}

/** все треки; загруженный с тем же именем перекрывает сид-версию */
export function allTracks(): RadioTrack[] {
  const up = uploadedTracks();
  const names = new Set(up.map((t) => t.id));
  return [...seedTracks().filter((t) => !names.has(t.id)), ...up];
}

/**
 * Плейлист радио: всё, что в эфире (onAir !== false). Если админ снял всё —
 * возвращаем сид целиком, чтобы радио не замолчало.
 */
export function onAirTracks(onAir: Record<string, boolean>): RadioTrack[] {
  const alive = allTracks().filter((t) => isOnAir(onAir, t.id));
  return alive.length ? alive : seedTracks();
}
