import type { LocalText } from '../lib/types';

/**
 * Анонс обновлений: показывается ОДИН раз после выхода новой версии
 * (бегущие строки через центр экрана, см. fx/UpdatesTicker.tsx).
 * ПРАВИЛО: при каждом бампе версии в package.json заменять notes на то,
 * что реально поменялось с прошлого релиза (коротко, по-русски и по-английски).
 */
export const UPDATE_NOTES: LocalText[] = [
  { ru: 'ОБНОВЛЕНИЕ ▸ ИНТРО НА НАСТОЯЩЕМ ВИДЕО', en: 'UPDATE ▸ REAL-VIDEO BOOT INTRO' },
  { ru: 'ФАВИКОНКА ▸ КОЛЕСО КРУТИТСЯ', en: 'FAVICON ▸ THE WHEEL SPINS' },
  { ru: 'ГЕНЕРАЦИЯ КАРТИНОК ▸ ТЕПЕРЬ И С СЕРВЕРА', en: 'IMAGE GEN ▸ NOW SERVER-SIDE TOO' },
  { ru: 'КАРУСЕЛЬ ТАЧЕК ▸ ЕДЕТ ПО КРУГУ САМА', en: 'CAR CAROUSEL ▸ SELF-DRIVING LOOP' },
];
