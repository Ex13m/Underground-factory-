import type { LocalText } from '../lib/types';

/**
 * Анонс обновлений: показывается ОДИН раз после выхода новой версии
 * (бегущие строки через центр экрана, см. fx/UpdatesTicker.tsx).
 * ПРАВИЛО: при каждом бампе версии в package.json заменять notes на то,
 * что реально поменялось с прошлого релиза (коротко, по-русски и по-английски).
 */
export const UPDATE_NOTES: LocalText[] = [
  { ru: 'UF RADIO ▸ 13 ТРЕКОВ, ДИДЖЕЙСКИЕ ПЕРЕХОДЫ', en: 'UF RADIO ▸ 13 TRACKS, DJ CROSSFADES' },
  { ru: 'ИНТРО ▸ ФАРЫ БЬЮТ ПРЯМО В ОБЪЕКТИВ', en: 'INTRO ▸ HEADLIGHTS STRAIGHT INTO THE LENS' },
  { ru: 'МОНТАЖ ▸ +10 АГРЕССИВНЫХ ЭПИЗОДОВ', en: 'MONTAGE ▸ +10 AGGRESSIVE EPISODES' },
];
