import type { LocalText } from '../lib/types';

/**
 * Анонс обновлений: показывается ОДИН раз после выхода новой версии
 * (бегущие строки через центр экрана, см. fx/UpdatesTicker.tsx).
 * ПРАВИЛО: при каждом бампе версии в package.json заменять notes на то,
 * что реально поменялось с прошлого релиза (коротко, по-русски и по-английски).
 */
export const UPDATE_NOTES: LocalText[] = [
  { ru: 'ВИДЕОСАЛОН ▸ ЗАПИСИ С КАМЕР, НОН-СТОП', en: 'CCTV LOUNGE ▸ CAMERA FEEDS, NONSTOP' },
  { ru: 'UF RADIO ▸ 13 ТРЕКОВ И РОВНЫЕ ПЕРЕХОДЫ', en: 'UF RADIO ▸ 13 TRACKS, SEAMLESS BLENDS' },
  { ru: 'ИНТРО ▸ ФАРЫ БЬЮТ ПРЯМО В ОБЪЕКТИВ', en: 'INTRO ▸ HEADLIGHTS STRAIGHT INTO THE LENS' },
];
