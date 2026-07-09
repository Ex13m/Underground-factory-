/**
 * ЭФИР — курирование hero-роликов из админки (вкладка «ЭФИР»).
 * off   — выключены из эфира (заставка главной + Видеосалон);
 * scrap — помечены в брак (заявка на удаление улетает в /api/queue).
 * Persist в localStorage ('uf:onair'), действует в этом браузере.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnAirState {
  off: string[];
  scrap: string[];
  toggle: (src: string) => void;
  markScrap: (src: string) => void;
  unmarkScrap: (src: string) => void;
  resetAll: () => void;
}

export const useOnAir = create<OnAirState>()(
  persist(
    (set) => ({
      off: [],
      scrap: [],
      toggle: (src) =>
        set((s) => ({
          off: s.off.includes(src) ? s.off.filter((x) => x !== src) : [...s.off, src],
        })),
      // брак автоматически снимает ролик с эфира
      markScrap: (src) =>
        set((s) => ({
          scrap: s.scrap.includes(src) ? s.scrap : [...s.scrap, src],
          off: s.off.includes(src) ? s.off : [...s.off, src],
        })),
      // снимаем только пометку брака; в эфир возвращают чекбоксом
      unmarkScrap: (src) => set((s) => ({ scrap: s.scrap.filter((x) => x !== src) })),
      // «Сбросить всё» — все ролики обратно в эфир
      resetAll: () => set({ off: [], scrap: [] }),
    }),
    { name: 'uf:onair' },
  ),
);

/**
 * Фильтр плейлиста по эфиру. Если после фильтра ничего не осталось —
 * возвращаем исходный список, чтобы заставка не осталась без фона.
 */
export function filterOnAir(sources: string[], off: string[]): string[] {
  if (!off.length) return sources;
  const offSet = new Set(off);
  const alive = sources.filter((s) => !offSet.has(s));
  return alive.length ? alive : sources;
}
