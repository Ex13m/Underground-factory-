import type { LocalText } from '../lib/types';

/**
 * Анонс обновлений: показывается ОДИН раз после выхода новой версии
 * (бегущие строки через центр экрана, см. fx/UpdatesTicker.tsx).
 * ПРАВИЛО: при каждом бампе версии в package.json заменять notes на то,
 * что реально поменялось с прошлого релиза (коротко, по-русски и по-английски).
 */
export const UPDATE_NOTES: LocalText[] = [
  { ru: 'НОВЫЙ РИЛС ▸ МАСЛ-КАРЫ 1970 ▸ ЗОЛОТОЙ ВЕК V8', en: 'NEW REEL ▸ MUSCLE CARS 1970 ▸ THE GOLDEN AGE OF V8' },
  { ru: 'КАРТОЧКИ ТАЧЕК ▸ ФОТО ЛИСТАЮТСЯ И СМОТРЯТСЯ КРУПНО', en: 'CAR CARDS ▸ PHOTOS FLIP AND ZOOM BIG' },
  { ru: 'АРТ-РЕДАКТОР ▸ ШЕСТЬ НЕЙРОСЕТЕЙ НА ОДНОМ КЛЮЧЕ', en: 'ART EDITOR ▸ SIX MODELS ON A SINGLE KEY' },
  { ru: 'КОД FIGABOSS2026 ▸ −15% КАЖДОМУ', en: 'CODE FIGABOSS2026 ▸ −15% FOR EVERYONE' },
];
