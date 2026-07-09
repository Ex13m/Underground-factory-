/**
 * РАДИО — состояние музыкального цеха (Админка → РАДИО + fx/MicroPlayer).
 * id трека = имя файла ('boost.mp3') для сида или имя загруженного файла.
 * - onAir     — трек в плейлисте радио (отсутствие записи = в эфире);
 * - first     — какой трек открывает эфир (по умолчанию boost.mp3);
 * - trims     — локальная обрезка {start,end} в секундах (радио её уважает);
 * - trackGain — авто-выравнивание громкости, дБ (псевдо-LUFS, меряет плеер);
 * - master    — мастеринг-цепочка Web Audio (EQ 3 полосы → компрессор → выход).
 * Persist в localStorage ('uf:radio'), действует в этом браузере.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MasterPreset = 'auto' | 'hifi' | 'club' | 'radio' | 'manual';

export interface MasterSettings {
  enabled: boolean;
  preset: MasterPreset;
  /** выходной gain, дБ */
  gain: number;
  bassDb: number;
  midDb: number;
  trebleDb: number;
  compThreshold: number;
  compRatio: number;
  /** целевая интегральная громкость эфира, LUFS (−14 — стандарт стриминга) */
  targetLufs: number;
  /** доля реверберации (эхо), 0..0.4 */
  reverbWet: number;
  /** стерео-объём: 1 — как есть, до 2 — шире */
  width: number;
  /** брик-лимитер на выходе — гасит перегрузы */
  limiter: boolean;
  /** срез инфранизкого гула (~28 Гц) — грязь и рокот вон */
  lowcut: boolean;
}

export interface TrimRange {
  start: number;
  end: number;
}

/** с этого трека радио стартует, если админ не выбрал другой */
export const DEFAULT_FIRST = 'boost.mp3';

/** пресеты мастеринга (без enabled/preset/targetLufs — цель LUFS пресетами не трогаем) */
export const MASTER_PRESETS: Record<Exclude<MasterPreset, 'manual'>, Omit<MasterSettings, 'enabled' | 'preset' | 'targetLufs'>> = {
  // единый стандарт эфира: больше эха и объёма, лимитер, срез гула
  auto: { gain: 0.5, bassDb: 2.5, midDb: 0.5, trebleDb: 2, compThreshold: -20, compRatio: 4, reverbWet: 0.14, width: 1.35, limiter: true, lowcut: true },
  // лёгкая полировка: чуть низа и воздуха, мягкий компрессор
  hifi: { gain: 0, bassDb: 2, midDb: 0, trebleDb: 1.5, compThreshold: -24, compRatio: 3, reverbWet: 0.08, width: 1.15, limiter: true, lowcut: true },
  // клуб: жирный низ, яркий верх, плотнее и громче
  club: { gain: 1, bassDb: 5, midDb: 0, trebleDb: 2, compThreshold: -18, compRatio: 4, reverbWet: 0.12, width: 1.3, limiter: true, lowcut: true },
  // FM-радио: выпуклая середина, плотный компрессор
  radio: { gain: 0, bassDb: 1, midDb: 2, trebleDb: 0, compThreshold: -30, compRatio: 6, reverbWet: 0.05, width: 1.1, limiter: true, lowcut: true },
};

interface RadioState {
  onAir: Record<string, boolean>;
  first: string | null;
  trims: Record<string, TrimRange>;
  trackGain: Record<string, number>;
  /** замеренная интегральная громкость трека (BS.1770), LUFS */
  trackLufs: Record<string, number>;
  master: MasterSettings;
  setOnAir: (id: string, on: boolean) => void;
  setFirst: (id: string | null) => void;
  /** null — убрать обрезку */
  setTrim: (id: string, trim: TrimRange | null) => void;
  setTrackGain: (id: string, db: number) => void;
  setTrackLufs: (id: string, lufs: number) => void;
  setMaster: (patch: Partial<MasterSettings>) => void;
  applyPreset: (p: Exclude<MasterPreset, 'manual'>) => void;
}

export const useRadio = create<RadioState>()(
  persist(
    (set) => ({
      onAir: {},
      first: DEFAULT_FIRST,
      trims: {},
      trackGain: {},
      trackLufs: {},
      master: { enabled: true, preset: 'hifi', targetLufs: -14, ...MASTER_PRESETS.hifi },
      setOnAir: (id, on) => set((s) => ({ onAir: { ...s.onAir, [id]: on } })),
      setFirst: (id) => set({ first: id }),
      setTrim: (id, trim) =>
        set((s) => {
          const trims = { ...s.trims };
          if (trim) trims[id] = trim;
          else delete trims[id];
          return { trims };
        }),
      setTrackGain: (id, db) => set((s) => ({ trackGain: { ...s.trackGain, [id]: db } })),
      setTrackLufs: (id, lufs) => set((s) => ({ trackLufs: { ...s.trackLufs, [id]: lufs } })),
      setMaster: (patch) => set((s) => ({ master: { ...s.master, ...patch } })),
      applyPreset: (p) => set((s) => ({ master: { ...s.master, preset: p, ...MASTER_PRESETS[p] } })),
    }),
    {
      name: 'uf:radio',
      // сохранённый ранее master без targetLufs не должен затирать дефолт
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<RadioState>;
        return { ...current, ...p, master: { ...current.master, ...(p.master ?? {}) } };
      },
    },
  ),
);

/** трек в эфире? (отсутствие записи = да) */
export const isOnAir = (onAir: Record<string, boolean>, id: string) => onAir[id] !== false;
