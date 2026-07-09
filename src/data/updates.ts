import type { LocalText } from '../lib/types';

/**
 * Анонс обновлений: показывается ОДИН раз после выхода новой версии
 * (бегущие строки через центр экрана, см. fx/UpdatesTicker.tsx).
 * ПРАВИЛО: при каждом бампе версии в package.json заменять notes на то,
 * что реально поменялось с прошлого релиза (коротко, по-русски и по-английски).
 */
export const UPDATE_NOTES: LocalText[] = [
  { ru: 'ВИДЕО ПОЛЕГЧАЛО В 5 РАЗ ▸ САЙТ ЛЕТАЕТ', en: 'VIDEO 5X LIGHTER ▸ SITE FLIES' },
  { ru: 'АДМИНКА ▸ ВКЛАДКА «ЭФИР»: КУРАТОР РОЛИКОВ', en: 'ADMIN ▸ ON AIR TAB: CLIP CURATOR' },
  { ru: 'БРАК — ГАЛОЧКОЙ, УДАЛЕНИЕ — АВТОМАТОМ', en: 'SCRAP WITH A CLICK, DELETION AUTOMATED' },
];
