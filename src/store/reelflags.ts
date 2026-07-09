/**
 * Флаги рилсов на полке (Админка → КОНТЕНТ): конвейер одобрения.
 * - approved  — рилс одобрен владельцем (готов к посту);
 * - autopost  — публиковать автоматически через агрегатор
 *               (агрегатор подключим отдельно — владелец скажет какой);
 * - published — уже опубликован (маркер-сигнал на карточке).
 * Persist в localStorage 'uf:reels'. Ключ — путь файла рилса.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ReelFlags {
  approved: boolean;
  autopost: boolean;
  published: boolean;
}

const EMPTY: ReelFlags = { approved: false, autopost: false, published: false };

interface ReelFlagsState {
  flags: Record<string, ReelFlags>;
  setFlag: (file: string, patch: Partial<ReelFlags>) => void;
}

export const useReelFlags = create<ReelFlagsState>()(
  persist(
    (set) => ({
      flags: {},
      setFlag: (file, patch) =>
        set((s) => ({
          flags: { ...s.flags, [file]: { ...EMPTY, ...s.flags[file], ...patch } },
        })),
    }),
    { name: 'uf:reels' },
  ),
);

export const reelFlags = (flags: Record<string, ReelFlags>, file: string): ReelFlags =>
  flags[file] ?? EMPTY;
