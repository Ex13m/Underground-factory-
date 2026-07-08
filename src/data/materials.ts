import type { LocalText, MaterialGrade } from '../lib/types';

/**
 * Паспорта материалов: история «как делают деталь» + техпараметры.
 * Видео-фоны сгенерированы нейросетью (Higgsfield), лежат локально.
 * Редактируются в Админке → МАТЕРИАЛЫ (localStorage-оверлей, см. lib/api.ts).
 */

export interface MaterialSpec {
  label: LocalText;
  value: string;
}

export interface MaterialInfo {
  grade: MaterialGrade;
  name: LocalText;
  story: LocalText;
  /** фоновое видео модалки */
  video: string;
  specs: MaterialSpec[];
}

export const DEFAULT_MATERIALS: Record<MaterialGrade, MaterialInfo> = {
  carbon: {
    grade: 'carbon',
    name: { ru: 'Карбон', en: 'Carbon' },
    story: {
      ru: 'Препрег раскраивается по лекалам, укладывается в матрицу слой за слоем под углом 45°, вакуумируется и уезжает в автоклав: 6 бар, 135°C, ни грамма лишней смолы. После запекания деталь шлифуется и уходит под UV-лак — плетение остаётся на виду, потому что его не стыдно показывать.',
      en: 'Prepreg is cut to templates, laid into the mold ply by ply at 45°, vacuum-bagged and rolled into the autoclave: 6 bar, 135°C, not a gram of excess resin. After curing the part is sanded and UV-clearcoated — the weave stays visible because it has nothing to hide.',
    },
    video: '/video/mat-carbon.mp4',
    specs: [
      { label: { ru: 'Плотность', en: 'Density' }, value: '1.55 г/см³' },
      { label: { ru: 'Термостойкость', en: 'Heat resistance' }, value: '220°C' },
      { label: { ru: 'Вес к стали', en: 'Weight vs steel' }, value: '−60%' },
      { label: { ru: 'Плетение', en: 'Weave' }, value: '2×2 твил' },
      { label: { ru: 'Отверждение', en: 'Curing' }, value: 'автоклав, 6 бар / 135°C' },
    ],
  },
  composite: {
    grade: 'composite',
    name: { ru: 'Композит', en: 'Composite' },
    story: {
      ru: 'Стеклоткань укладывается в матрицу вручную, пропитывается эпоксидной смолой и прикатывается валиком слой за слоем. Сохнет сутки, шлифуется, грунтуется. Дешевле карбона, жёстче АБС, чинится в любом гараже — рабочая лошадь трека.',
      en: 'Fibreglass cloth is hand-laid into the mold, wetted with epoxy and rolled ply by ply. A day to cure, then sanding and primer. Cheaper than carbon, stiffer than ABS, repairable in any garage — the workhorse of the track.',
    },
    video: '/video/mat-composite.mp4',
    specs: [
      { label: { ru: 'Плотность', en: 'Density' }, value: '1.8 г/см³' },
      { label: { ru: 'Термостойкость', en: 'Heat resistance' }, value: '140°C' },
      { label: { ru: 'Вес к стали', en: 'Weight vs steel' }, value: '−40%' },
      { label: { ru: 'Основа', en: 'Base' }, value: 'стеклоткань + эпоксид' },
      { label: { ru: 'Ремонтопригодность', en: 'Repairability' }, value: 'высокая' },
    ],
  },
  abs: {
    grade: 'abs',
    name: { ru: 'АБС-пластик', en: 'ABS plastic' },
    story: {
      ru: 'Гранулы АБС плавятся при 240°C и впрыскиваются в стальную пресс-форму под давлением. Минута цикла — деталь готова: гибкая, живучая, не боится бордюров. Царапнул — зашкурил, покрасил, поехал дальше. Идеальный первый шаг.',
      en: 'ABS pellets melt at 240°C and get injected into a steel mold under pressure. One-minute cycle — the part is done: flexible, tough, curb-proof. Scraped it? Sand, paint, keep driving. The perfect first step.',
    },
    video: '/video/mat-abs.mp4',
    specs: [
      { label: { ru: 'Плотность', en: 'Density' }, value: '1.05 г/см³' },
      { label: { ru: 'Термостойкость', en: 'Heat resistance' }, value: '90°C' },
      { label: { ru: 'Вес к стали', en: 'Weight vs steel' }, value: '−30%' },
      { label: { ru: 'Технология', en: 'Process' }, value: 'литьё под давлением' },
      { label: { ru: 'Ремонтопригодность', en: 'Repairability' }, value: 'шкурка + краска' },
    ],
  },
};
