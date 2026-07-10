/**
 * БИБЛИОТЕКА фото тачки — постоянный склад генераций и загрузок объекта.
 * Каждая удачная генерация/загрузка в арт-редакторе на объект car-<id>
 * автоматически остаётся здесь (склад), дальше админ решает:
 * - on  — «в альбоме»: фото показывается в листалке большой карточки
 *         (продолжение галереи после основного видео) — это и есть одобрение;
 * - ref — зелёная галочка «референс»: фото уходит референсом в генерацию.
 * Удаление — навсегда. Дефолтный слайд карточки — всегда видео.
 * Persist в localStorage 'uf:cargallery' (dataURL/URL, до 24 на тачку).
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { idbKV } from '../lib/idbkv';

export interface GalleryPhoto {
  url: string;
  /** в альбоме карточки (одобрено) */
  on: boolean;
  /** референс для генерации (зелёная галочка) */
  ref?: boolean;
}

interface CarGalleryState {
  photos: Record<string, GalleryPhoto[]>;
  /** добавить в склад; дубликаты по url не плодим */
  addPhoto: (carId: string, url: string, patch?: Partial<Omit<GalleryPhoto, 'url'>>) => void;
  /** пометки: в альбом (on) / референс (ref) */
  setPhoto: (carId: string, index: number, patch: Partial<Omit<GalleryPhoto, 'url'>>) => void;
  removePhoto: (carId: string, index: number) => void;
}

const MAX_PER_CAR = 24;

export const useCarGallery = create<CarGalleryState>()(
  persist(
    (set) => ({
      photos: {},
      addPhoto: (carId, url, patch) =>
        set((s) => {
          const list = s.photos[carId] ?? [];
          const at = list.findIndex((p) => p.url === url);
          if (at >= 0) {
            // уже на складе — только дообновляем пометки
            if (!patch) return s;
            const next = list.map((p, i) => (i === at ? { ...p, ...patch } : p));
            return { photos: { ...s.photos, [carId]: next } };
          }
          const next = [...list, { url, on: false, ref: false, ...patch }].slice(-MAX_PER_CAR);
          return { photos: { ...s.photos, [carId]: next } };
        }),
      setPhoto: (carId, index, patch) =>
        set((s) => ({
          photos: {
            ...s.photos,
            [carId]: (s.photos[carId] ?? []).map((p, i) => (i === index ? { ...p, ...patch } : p)),
          },
        })),
      removePhoto: (carId, index) =>
        set((s) => ({
          photos: {
            ...s.photos,
            [carId]: (s.photos[carId] ?? []).filter((_, i) => i !== index),
          },
        })),
    }),
    {
      name: 'uf:cargallery',
      // dataURL-фото тяжёлые: localStorage (≈5МБ) выбивало квоту, и склад
      // «не пополнялся» после перезагрузки — храним в IndexedDB
      storage: createJSONStorage(() => idbKV),
      onRehydrateStorage: () => (state) => {
        // одноразовая миграция старого склада из localStorage
        try {
          const old = localStorage.getItem('uf:cargallery');
          if (old && state) {
            const parsed = JSON.parse(old) as { state?: { photos?: Record<string, GalleryPhoto[]> } };
            const photos = parsed?.state?.photos;
            if (photos && Object.keys(photos).length) {
              useCarGallery.setState((s) => ({ photos: { ...photos, ...s.photos } }));
            }
            localStorage.removeItem('uf:cargallery');
          }
        } catch { /* мигрировать нечего */ }
      },
    },
  ),
);
