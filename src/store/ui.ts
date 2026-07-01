import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Lang } from '../lib/types';

interface UIState {
  lang: Lang;
  /** calm mode = heavy FX off (cursor car, scroll scenes) */
  calm: boolean;
  seenHints: Record<string, boolean>;
  setLang: (l: Lang) => void;
  toggleCalm: () => void;
  markHint: (id: string) => void;
}

export const useUI = create<UIState>()(
  persist(
    (set) => ({
      lang: 'ru',
      calm: false,
      seenHints: {},
      setLang: (lang) => set({ lang }),
      toggleCalm: () => set((s) => ({ calm: !s.calm })),
      markHint: (id) => set((s) => ({ seenHints: { ...s.seenHints, [id]: true } })),
    }),
    { name: 'uf:ui' },
  ),
);
