/**
 * Галерея фото тачки для большой карточки (CarModal).
 * Каждое фото, «Применённое» в арт-редакторе на объект car-<id>, автоматически
 * попадает сюда; галочкой (on) админ решает, показывать ли его в листалке
 * карточки. Дефолтный слайд карточки — всегда видео.
 * Persist в localStorage 'uf:cargallery' (данные — dataURL/URL, до 8 на тачку).
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GalleryPhoto {
  url: string;
  on: boolean;
}

interface CarGalleryState {
  photos: Record<string, GalleryPhoto[]>;
  addPhoto: (carId: string, url: string) => void;
  togglePhoto: (carId: string, index: number, on: boolean) => void;
  removePhoto: (carId: string, index: number) => void;
}

const MAX_PER_CAR = 8;

export const useCarGallery = create<CarGalleryState>()(
  persist(
    (set) => ({
      photos: {},
      addPhoto: (carId, url) =>
        set((s) => {
          const list = s.photos[carId] ?? [];
          if (list.some((p) => p.url === url)) return s; // дубль
          const next = [...list, { url, on: true }].slice(-MAX_PER_CAR);
          return { photos: { ...s.photos, [carId]: next } };
        }),
      togglePhoto: (carId, index, on) =>
        set((s) => ({
          photos: {
            ...s.photos,
            [carId]: (s.photos[carId] ?? []).map((p, i) => (i === index ? { ...p, on } : p)),
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
    { name: 'uf:cargallery' },
  ),
);
