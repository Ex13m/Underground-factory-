import type { LocalText } from '../lib/types';

/**
 * Анонс обновлений: показывается ОДИН раз после выхода новой версии
 * (бегущие строки через центр экрана, см. fx/UpdatesTicker.tsx).
 * ПРАВИЛО: при каждом бампе версии в package.json заменять notes на то,
 * что реально поменялось с прошлого релиза (коротко, по-русски и по-английски).
 */
export const UPDATE_NOTES: LocalText[] = [
  { ru: 'РИЛС МАСЛ-КАРЫ 1970 ▸ ТЕПЕРЬ С ВАЙБОМ ЭПОХИ', en: 'MUSCLE 1970 REEL ▸ NOW WITH TRUE ERA VIBE' },
  { ru: 'КАРТОЧКИ ТАЧЕК ▸ ФОТО ЛИСТАЮТСЯ И СМОТРЯТСЯ КРУПНО', en: 'CAR CARDS ▸ PHOTOS FLIP AND ZOOM BIG' },
  { ru: 'АРТ-РЕДАКТОР ▸ АГЕНТ ЗНАЕТ ТВОЮ ТАЧКУ В ЛИЦО', en: 'ART EDITOR ▸ THE AGENT KNOWS YOUR CAR BY HEART' },
  { ru: 'У КАЖДОЙ ТАЧКИ ▸ СВОЯ БИБЛИОТЕКА ГЕНЕРАЦИЙ', en: 'EVERY CAR ▸ ITS OWN GENERATION LIBRARY' },
  { ru: 'КОД FIGABOSS2026 ▸ −15% КАЖДОМУ', en: 'CODE FIGABOSS2026 ▸ −15% FOR EVERYONE' },
];
