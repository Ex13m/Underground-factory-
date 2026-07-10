import type { LocalText } from '../lib/types';

/**
 * Анонс обновлений: показывается ОДИН раз после выхода новой версии
 * (бегущие строки через центр экрана, см. fx/UpdatesTicker.tsx).
 * ПРАВИЛО: при каждом бампе версии в package.json заменять notes на то,
 * что реально поменялось с прошлого релиза (коротко, по-русски и по-английски).
 */
export const UPDATE_NOTES: LocalText[] = [
  { ru: 'КАРТОЧКИ ТАЧЕК ▸ ТОЛЬКО ОДОБРЕННЫЕ КАДРЫ', en: 'CAR CARDS ▸ APPROVED SHOTS ONLY' },
  { ru: 'У КАЖДОЙ ТАЧКИ ▸ СВОЯ БИБЛИОТЕКА ГЕНЕРАЦИЙ', en: 'EVERY CAR ▸ ITS OWN GENERATION LIBRARY' },
  { ru: 'НЕЙРОСЕТИ ▸ ВЕЗДЕ ПОСЛЕДНИЕ ВЕРСИИ', en: 'AI MODELS ▸ LATEST VERSIONS EVERYWHERE' },
  { ru: '✨ УЛУЧШАТЕЛЬ ПРОМПТОВ ▸ ТВОЙ ЗАМЫСЕЛ — ЗАКОН', en: '✨ PROMPT BOOSTER ▸ YOUR IDEA IS THE LAW' },
  { ru: 'ЗАСТАВКИ ГЕНЕРЯТСЯ САМИ ▸ КНОПКА МЕРЦАЕТ — ЦЕХ РАБОТАЕТ', en: 'INTRO CLIPS SELF-GENERATE ▸ BLINKING BUTTON = SHOP AT WORK' },
  { ru: 'КОД FIGABOSS2026 ▸ −15% КАЖДОМУ', en: 'CODE FIGABOSS2026 ▸ −15% FOR EVERYONE' },
];
