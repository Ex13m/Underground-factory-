import type { LocalText } from '../lib/types';

/**
 * Анонс обновлений: показывается ОДИН раз после выхода новой версии
 * (бегущие строки через центр экрана, см. fx/UpdatesTicker.tsx).
 * ПРАВИЛО: при каждом бампе версии в package.json заменять notes на то,
 * что реально поменялось с прошлого релиза (коротко, по-русски и по-английски).
 */
export const UPDATE_NOTES: LocalText[] = [
  { ru: 'ИНТРО ▸ ВСПЫШКА ФАР И СРАЗУ В ЦЕХ', en: 'INTRO ▸ HEADLIGHT BURST, STRAIGHT TO THE SHOP' },
  { ru: 'АРТ-РЕДАКТОР ▸ ПРОМПТ СОБЕРЁТСЯ САМ', en: 'ART EDITOR ▸ THE PROMPT WRITES ITSELF' },
  { ru: 'ГЕНЕРАЦИЯ ▸ КАЧЕСТВЕННЕЕ И С СЕРВЕРА', en: 'IMAGE GEN ▸ SHARPER, SERVER-SIDE TOO' },
];
