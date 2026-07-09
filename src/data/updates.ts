import type { LocalText } from '../lib/types';

/**
 * Анонс обновлений: показывается ОДИН раз после выхода новой версии
 * (бегущие строки через центр экрана, см. fx/UpdatesTicker.tsx).
 * ПРАВИЛО: при каждом бампе версии в package.json заменять notes на то,
 * что реально поменялось с прошлого релиза (коротко, по-русски и по-английски).
 */
export const UPDATE_NOTES: LocalText[] = [
  { ru: 'ПРОМОКОД PITSTOP26 ▸ −15% КАЖДОМУ', en: 'PROMO CODE PITSTOP26 ▸ −15% FOR EVERYONE' },
  { ru: 'UF RADIO ▸ АВТОМАСТЕРИНГ: ЭХО, ОБЪЁМ, РОВНЫЙ LUFS', en: 'UF RADIO ▸ AUTO-MASTER: ECHO, WIDTH, EVEN LUFS' },
  { ru: 'ЦЕХ РИЛСОВ ЗАПУЩЕН ▸ ПЕРВЫЙ ВЫПУСК НА ПОЛКЕ', en: 'REEL SHOP IS LIVE ▸ FIRST DROP ON THE SHELF' },
];
