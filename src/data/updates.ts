import type { LocalText } from '../lib/types';

/**
 * Анонс обновлений: показывается ОДИН раз после выхода новой версии
 * (бегущие строки через центр экрана, см. fx/UpdatesTicker.tsx).
 * ПРАВИЛО: при каждом бампе версии в package.json заменять notes на то,
 * что реально поменялось с прошлого релиза (коротко, по-русски и по-английски).
 */
export const UPDATE_NOTES: LocalText[] = [
  { ru: 'ПИТ-БОСС ОЖИЛ ▸ ПОВОДИ МЫШКОЙ — ОН ПОМАШЕТ', en: 'PIT BOSS IS ALIVE ▸ MOVE THE MOUSE — HE WAVES' },
  { ru: 'UF RADIO ▸ МАСТЕРИНГ HI-FI И РОВНАЯ ГРОМКОСТЬ', en: 'UF RADIO ▸ HI-FI MASTERING, EVEN LOUDNESS' },
  { ru: 'ЦЕХА АДМИНКИ ▸ ВИДЕОРЕДАКТОР, РАДИО, РИЛСЫ', en: 'ADMIN SHOPS ▸ VIDEO EDITOR, RADIO, REELS' },
];
