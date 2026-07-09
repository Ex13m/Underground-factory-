import type { LocalText } from '../lib/types';

/**
 * Анонс обновлений: показывается ОДИН раз после выхода новой версии
 * (бегущие строки через центр экрана, см. fx/UpdatesTicker.tsx).
 * ПРАВИЛО: при каждом бампе версии в package.json заменять notes на то,
 * что реально поменялось с прошлого релиза (коротко, по-русски и по-английски).
 */
export const UPDATE_NOTES: LocalText[] = [
  { ru: 'ЦЕХ РИЛСОВ ▸ ТЕПЕРЬ И ПО ФОТО ТВОЕЙ ТАЧКИ', en: 'REEL SHOP ▸ NOW FROM A PHOTO OF YOUR CAR' },
  { ru: 'ПИТ-БОСС ВОДИТ ПО ЦЕХУ ▸ СКАЖИ «ОТКРОЙ КОРЗИНУ»', en: 'PIT BOSS GUIDES YOU ▸ SAY "OPEN THE CART"' },
  { ru: 'КОД FIGABOSS2026 ▸ −15% КАЖДОМУ', en: 'CODE FIGABOSS2026 ▸ −15% FOR EVERYONE' },
];
