import type { LocalText } from '../lib/types';

/**
 * Анонс обновлений: показывается ОДИН раз после выхода новой версии
 * (бегущие строки через центр экрана, см. fx/UpdatesTicker.tsx).
 * ПРАВИЛО: при каждом бампе версии в package.json заменять notes на то,
 * что реально поменялось с прошлого релиза (коротко, по-русски и по-английски).
 */
export const UPDATE_NOTES: LocalText[] = [
  { ru: '+30 РОЛИКОВ ▸ МУСТАНГ, ЛАМБО, ГЕЛИК И ЛЕГЕНДЫ ТРЕКА', en: '+30 CLIPS ▸ MUSTANG, LAMBO, G-WAGEN & TRACK LEGENDS' },
  { ru: 'ЭКШН-ЭФИР ▸ ПОГОНИ, ТРЮКИ, ОПАСНЫЕ МОМЕНТЫ', en: 'ACTION FEED ▸ PURSUITS, STUNTS, CLOSE CALLS' },
  { ru: 'ПИТ-БОСС ▸ ОБРАТНАЯ СВЯЗЬ ПРЯМО В ЧАТЕ', en: 'PIT BOSS ▸ FEEDBACK RIGHT IN THE CHAT' },
];
