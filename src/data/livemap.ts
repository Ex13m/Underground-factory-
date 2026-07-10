/**
 * Заставки кастомных тачек: id тачки → путь к live-ролику в репозитории.
 * Кастомные тачки живут в localStorage админа, и Claude не может дописать им
 * поле video при исполнении заявки — поэтому связь «тачка → заставка» для них
 * ведётся здесь (заполняет Claude при исполнении заявок kind:'video'
 * с ключом car-live-<id>). Сид-тачки используют своё поле video как раньше.
 */

export const LIVE_CLIPS: Record<string, string> = {
  'nissan-370z-z34-mrdyouja': '/media/cars/nissan-370z-z34-mrdyouja/live.mp4',
  // BMW X5: фото карточки в браузере админа не добралось до заявки (мост
  // фото добавлен только в этом релизе), поэтому канон и заставка сгенерированы
  // парой — фото лежит рядом: /media/cars/bmw-x5-mrf0arcb/photo.jpg
  'bmw-x5-mrf0arcb': '/media/cars/bmw-x5-mrf0arcb/live.mp4',
};

/** заставка тачки: сид-поле video или запись из карты кастомных */
export const liveClipOf = (carId: string, seedVideo?: string): string | undefined =>
  seedVideo || LIVE_CLIPS[carId];
