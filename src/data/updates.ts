import type { LocalText } from '../lib/types';

/**
 * Анонс обновлений: показывается ОДИН раз после выхода новой версии
 * (бегущие строки через центр экрана, см. fx/UpdatesTicker.tsx).
 * ПРАВИЛО: при каждом бампе версии в package.json заменять notes на то,
 * что реально поменялось с прошлого релиза (коротко, по-русски и по-английски).
 */
export const UPDATE_NOTES: LocalText[] = [
  { ru: 'САЙТ ОБНОВЛЯЕТСЯ САМ ▸ ВСЕГДА СВЕЖАЯ СБОРКА', en: 'THE SITE UPDATES ITSELF ▸ ALWAYS THE FRESH BUILD' },
  { ru: 'ВЕРСИЯ ЖИВЁТ В ШАПКЕ ▸ С ХАРАКТЕРОМ', en: 'THE VERSION LIVES IN THE HEADER ▸ WITH ATTITUDE' },
  { ru: 'КОД FIGABOSS2026 ▸ −15% КАЖДОМУ', en: 'CODE FIGABOSS2026 ▸ −15% FOR EVERYONE' },
];
