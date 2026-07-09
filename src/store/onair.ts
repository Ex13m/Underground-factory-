/**
 * ЭФИР — курирование hero-роликов из админки (вкладка «ЭФИР»).
 * off   — выключены из эфира (заставка главной + Видеосалон);
 * scrap — помечены в брак (заявка на удаление улетает в /api/queue);
 * trims — виртуальная обрезка: путь ролика → отрезок {start,end} в секундах,
 *         VideoBg играет только этот кусок (задаётся в видеоредакторе).
 * Persist в localStorage ('uf:onair'), действует в этом браузере.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TrimRange {
  start: number;
  end: number;
}

interface OnAirState {
  off: string[];
  scrap: string[];
  trims: Record<string, TrimRange>;
  toggle: (src: string) => void;
  markScrap: (src: string) => void;
  unmarkScrap: (src: string) => void;
  setTrim: (src: string, start: number, end: number) => void;
  clearTrim: (src: string) => void;
  resetAll: () => void;
}

export const useOnAir = create<OnAirState>()(
  persist(
    (set) => ({
      off: [],
      scrap: [],
      trims: {},
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
      // виртуальная обрезка (видеоредактор): эфир играет только отрезок [start, end]
      setTrim: (src, start, end) =>
        set((s) => ({ trims: { ...s.trims, [src]: { start, end } } })),
      clearTrim: (src) =>
        set((s) => {
          const next = { ...s.trims };
          delete next[src];
          return { trims: next };
        }),
      // «Сбросить всё» — все ролики обратно в эфир (обрезки не трогаем)
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
