/**
 * Полка готовых рилсов (Админка → КОНТЕНТ). Заполняет Claude в терминале
 * при исполнении заявок kind:'reel' из /api/queue: готовый файл кладётся
 * в public/media/reels/, сюда добавляется запись { file, title, createdAt }.
 */

import type { LocalText } from '../lib/types';

export interface Reel {
  /** путь к файлу, например '/media/reels/silvia-drift.mp4' (9:16) */
  file: string;
  title: LocalText;
  /** дата производства, ISO 'YYYY-MM-DD' */
  createdAt: string;
}

export const REELS: Reel[] = [
  {
    // фан-сборник «полицейская камера»: прыжок через кордон, снос конусов,
    // мигалки в зеркалах, прыжок разводного моста, пончики вокруг патруля,
    // патруль в коробках. Оверлеи UF-PD CAM/таймкод/REC. 6 клипов, ~45 кр.
    file: '/media/reels/reel-ufpd-compilation.mp4',
    title: { ru: 'СВОДКА UF-PD ▸ СБОРНИК ПОГОНЬ', en: 'UF-PD REPORT ▸ PURSUIT COMPILATION' },
    createdAt: '2026-07-09',
  },
  {
    // E36 + зеркала APEX VIEW: погоня — уход от преследования, отражение фар
    // в карбоновом зеркале, макро твила, финал в укрытии. Титры-характеристики,
    // CTA FIGABOSS2026. 6 клипов kling 9:16, 12 склеек, ~45 кредитов HF.
    file: '/media/reels/reel-e36-mirrors-chase.mp4',
    title: { ru: 'BMW E36 ▸ ЗЕРКАЛА APEX VIEW ▸ ПОГОНЯ', en: 'BMW E36 ▸ APEX VIEW MIRRORS ▸ CHASE' },
    createdAt: '2026-07-09',
  },
  {
    // Supra A80 + полный кит: хук-экшн → сток → глитч-трансформация → деталь →
    // тоннель → финал с CTA (PITSTOP26). 6 клипов kling 9:16, ~45 кредитов HF.
    file: '/media/reels/reel-supra-fullkit-nightrace.mp4',
    title: { ru: 'SUPRA A80 ▸ ПОЛНЫЙ КИТ ▸ НОЧНАЯ ГОНКА', en: 'SUPRA A80 ▸ FULL KIT ▸ NIGHT RACE' },
    createdAt: '2026-07-09',
  },
];
