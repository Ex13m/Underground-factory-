import type { CarModel, Product } from '../lib/types';

/**
 * Seed catalog. Live catalog = seed + admin additions (localStorage overlay), see lib/api.ts.
 * Image URLs are hot-linked stock photos; every consumer must render them through
 * lib/media.tsx so an unreachable URL falls back to generated decal art.
 */

const u = (id: string, w = 1400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

// медиа-хранилище: public/media/cars/<id>/{photo.jpg, live.mp4, parts/<productId>/<материал>/N.jpg}
const carMedia = (id: string) => ({
  img: `/media/cars/${id}/photo.jpg`,
  video: `/media/cars/${id}/live.mp4`,
});

export const SEED_CARS: CarModel[] = [
  // фото и «живые» видео сгенерированы нейросетью (Higgsfield)
  { id: 'nissan-silvia-s15', make: 'Nissan', model: 'Silvia S15', years: '1999–2002', ...carMedia('nissan-silvia-s15') },
  { id: 'toyota-supra-a80', make: 'Toyota', model: 'Supra A80', years: '1993–2002', ...carMedia('toyota-supra-a80') },
  { id: 'mazda-rx7-fd', make: 'Mazda', model: 'RX-7 FD', years: '1992–2002', ...carMedia('mazda-rx7-fd') },
  { id: 'toyota-ae86', make: 'Toyota', model: 'AE86 Trueno', years: '1983–1987', ...carMedia('toyota-ae86') },
  { id: 'bmw-e36', make: 'BMW', model: 'E36 Coupe', years: '1990–2000', ...carMedia('bmw-e36') },
  { id: 'honda-civic-ek9', make: 'Honda', model: 'Civic EK9', years: '1997–2000', ...carMedia('honda-civic-ek9') },
  { id: 'nissan-gtr-r34', make: 'Nissan', model: 'Skyline R34', years: '1999–2002', ...carMedia('nissan-gtr-r34') },
  { id: 'lada-2107', make: 'LADA', model: '2107', years: '1982–2012', ...carMedia('lada-2107') },
];

/** путь к фото детали в хранилище: родная тачка → деталь → материал → номер */
const part = (carId: string, productId: string, grade: string, n: number) =>
  `/media/cars/${carId}/parts/${productId}/${grade}/${n}.jpg`;

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'kit-widebody-s15',
    sku: 'UF-KIT/01',
    name: { ru: 'Widebody «SILHOUETTE DIV.»', en: 'Widebody "SILHOUETTE DIV."' },
    desc: {
      ru: 'Карбоновые расширители арок под слик 295. +30 см ширины, минус все сомнения на парковке. Закладные и крепёж из нержавейки — в комплекте.',
      en: 'Carbon arch flares built for 295 slicks. +30 cm of width, minus every doubt in the parking lot. Stainless hardware and inserts included.',
    },
    price: 3200,
    weightGrams: 6400,
    heatC: 200,
    rarity: 'carbon',
    material: { ru: 'Карбон 2×2 твил, автоклав', en: '2×2 twill carbon, autoclave-cured' },
    fits: ['nissan-silvia-s15', 'nissan-gtr-r34', 'mazda-rx7-fd'],
    media: [
      { type: 'image', url: part('nissan-silvia-s15', 'kit-widebody-s15', 'carbon', 1), seed: 'kit-widebody-s15-a' },
      { type: 'image', url: part('nissan-silvia-s15', 'kit-widebody-s15', 'carbon', 2), seed: 'kit-widebody-s15-b' },
    ],
    hit: true,
  },
  {
    id: 'wing-gt-supra',
    sku: 'UF-WNG/02',
    name: { ru: 'GT-крыло «GURNEY GODZILLA»', en: 'GT Wing "GURNEY GODZILLA"' },
    desc: {
      ru: 'Двухэлементное карбоновое антикрыло с профилем под трек. Прижимная сила настоящая — как и уважение на пит-лейне. Алюминиевые стойки, регулировка угла атаки.',
      en: 'Dual-element carbon GT wing with a track-bred airfoil. The downforce is real — so is the pit-lane respect. Billet aluminium uprights, adjustable angle of attack.',
    },
    price: 1150,
    weightGrams: 3100,
    heatC: 210,
    rarity: 'carbon',
    material: { ru: 'Карбон 2×2 твил, автоклав', en: '2×2 twill carbon, autoclave-cured' },
    fits: ['toyota-supra-a80', 'bmw-e36', 'nissan-gtr-r34', 'mazda-rx7-fd', 'toyota-ae86'],
    media: [
      { type: 'image', url: part('toyota-supra-a80', 'wing-gt-supra', 'carbon', 1), seed: 'wing-gt-supra-a' },
      { type: 'image', url: part('toyota-supra-a80', 'wing-gt-supra', 'carbon', 2), seed: 'wing-gt-supra-b' },
    ],
    hit: true,
  },
  {
    id: 'splitter-rx7',
    sku: 'UF-SPL/03',
    name: { ru: 'Сплиттер «ROTARY RAZOR»', en: 'Splitter "ROTARY RAZOR"' },
    desc: {
      ru: 'Передний сплиттер из стеклокомпозита с усиленной кромкой. Держит поток на 200+, переживает бордюры лучше твоей самооценки. Тросы-тяги в комплекте.',
      en: 'Fibreglass composite front splitter with a reinforced leading edge. Keeps the airflow glued at 200+ km/h and survives curbs better than your ego. Support rods included.',
    },
    price: 420,
    weightGrams: 2600,
    heatC: 140,
    rarity: 'composite',
    material: { ru: 'Стеклокомпозит ручной укладки', en: 'Hand-laid fibreglass composite' },
    fits: ['mazda-rx7-fd', 'nissan-silvia-s15', 'honda-civic-ek9', 'toyota-supra-a80', 'toyota-ae86', 'bmw-e36', 'lada-2107'],
    media: [
      { type: 'image', url: part('mazda-rx7-fd', 'splitter-rx7', 'composite', 1), seed: 'splitter-rx7-a' },
      { type: 'image', url: part('mazda-rx7-fd', 'splitter-rx7', 'composite', 2), seed: 'splitter-rx7-b' },
    ],
  },
  {
    id: 'diffuser-chrome',
    sku: 'UF-DIF/04',
    name: { ru: 'Диффузор «MIRROR WEAVE»', en: 'Diffuser "MIRROR WEAVE"' },
    desc: {
      ru: 'Задний карбоновый диффузор в глянцевом лаке — плетение блестит как хром, работает как аэродинамика. Пять клыков, честный прирост прижима на трассе.',
      en: 'Rear carbon diffuser in gloss clearcoat — the weave shines like chrome, works like aero. Five strakes, honest downforce gains on track.',
    },
    price: 890,
    weightGrams: 2400,
    heatC: 190,
    rarity: 'carbon',
    material: { ru: 'Карбон, глянцевый лак UV-cut', en: 'Carbon fibre, UV-cut gloss clearcoat' },
    fits: ['bmw-e36', 'nissan-gtr-r34', 'toyota-supra-a80', 'nissan-silvia-s15', 'mazda-rx7-fd', 'honda-civic-ek9'],
    media: [
      { type: 'image', url: part('bmw-e36', 'diffuser-chrome', 'carbon', 1), seed: 'diffuser-chrome-a' },
      { type: 'image', url: part('bmw-e36', 'diffuser-chrome', 'carbon', 2), seed: 'diffuser-chrome-b' },
    ],
    hit: true,
  },
  {
    id: 'kit-wet-legend',
    sku: 'UF-LGD/05',
    name: { ru: 'Полный кит «ONE OF ONE» — сухой карбон', en: 'Full kit "ONE OF ONE" — dry carbon' },
    desc: {
      ru: 'Лимитированный полный обвес из сухого карбона: препрег, автоклав, ни грамма лишней смолы. Один экземпляр на партию, номерная табличка и паспорт детали прилагаются.',
      en: 'Limited full kit in dry carbon: prepreg, autoclave, not a gram of excess resin. One unit per batch — numbered plaque and part passport included.',
    },
    price: 4500,
    weightGrams: 5200,
    heatC: 220,
    rarity: 'carbon',
    material: { ru: 'Сухой карбон (препрег), автоклав', en: 'Dry carbon (prepreg), autoclave-cured' },
    fits: ['toyota-ae86', 'nissan-silvia-s15', 'mazda-rx7-fd'],
    media: [
      { type: 'image', url: part('toyota-ae86', 'kit-wet-legend', 'carbon', 1), seed: 'kit-wet-legend-a' },
      { type: 'image', url: part('toyota-ae86', 'kit-wet-legend', 'carbon', 2), seed: 'kit-wet-legend-b' },
    ],
    hit: true,
  },
  {
    id: 'lip-ae86',
    sku: 'UF-LIP/06',
    name: { ru: 'Губа «DOWNHILL MASTER»', en: 'Front lip "DOWNHILL MASTER"' },
    desc: {
      ru: 'Передняя губа для хачироку из АБС-пластика. Гибкая, живучая, переживёт и бордюр, и горный серпантин. Царапнул — зашкурил, покрасил, поехал дальше.',
      en: 'ABS front lip for the hachi-roku. Flexible, tough, survives both curbs and mountain passes. Scraped it? Sand, paint, keep driving.',
    },
    price: 250,
    weightGrams: 1300,
    heatC: 90,
    rarity: 'abs',
    material: { ru: 'АБС + грунт под покраску', en: 'ABS + paint-ready primer' },
    fits: ['toyota-ae86', 'honda-civic-ek9', 'lada-2107'],
    media: [
      { type: 'image', url: part('toyota-ae86', 'lip-ae86', 'abs', 1), seed: 'lip-ae86-a' },
      { type: 'image', url: part('toyota-ae86', 'lip-ae86', 'abs', 2), seed: 'lip-ae86-b' },
    ],
  },
  {
    id: 'canards-civic',
    sku: 'UF-CNR/07',
    name: { ru: 'Канарды «УШКИ АГРЕССИИ»', en: 'Canards "AGGRO FINS"' },
    desc: {
      ru: 'Комплект из 4 композитных канардов. Реальный сдвиг баланса на перед и максимум агрессии в фас. Шаблоны для сверловки и крепёж — в коробке.',
      en: 'Set of 4 composite canards. A real front-end balance shift and maximum aggression head-on. Drill templates and hardware in the box.',
    },
    price: 260,
    weightGrams: 1200,
    heatC: 140,
    rarity: 'composite',
    material: { ru: 'Стеклокомпозит ручной укладки', en: 'Hand-laid fibreglass composite' },
    fits: ['honda-civic-ek9', 'nissan-silvia-s15', 'mazda-rx7-fd', 'toyota-ae86', 'nissan-gtr-r34'],
    media: [
      { type: 'image', url: part('honda-civic-ek9', 'canards-civic', 'composite', 1), seed: 'canards-civic-a' },
      { type: 'image', url: part('honda-civic-ek9', 'canards-civic', 'composite', 2), seed: 'canards-civic-b' },
    ],
  },
  {
    id: 'hood-vents-e36',
    sku: 'UF-HOD/08',
    name: { ru: 'Капот «ДЫШИ ГЛУБЖЕ»', en: 'Vented hood "BREATHE DEEP"' },
    desc: {
      ru: 'Вентилируемый композитный капот: горячий воздух выходит, температуры под капотом падают, мотор говорит спасибо. Совместим со штатными петлями.',
      en: 'Vented composite hood: hot air gets out, under-hood temps drop, the engine says thanks. Works with the factory hinges.',
    },
    price: 780,
    weightGrams: 5600,
    heatC: 140,
    rarity: 'composite',
    material: { ru: 'Стеклокомпозит, гелькоут чёрный', en: 'Fibreglass composite, black gelcoat' },
    fits: ['bmw-e36'],
    media: [
      { type: 'image', url: part('bmw-e36', 'hood-vents-e36', 'composite', 1), seed: 'hood-vents-e36-a' },
      { type: 'image', url: part('bmw-e36', 'hood-vents-e36', 'composite', 2), seed: 'hood-vents-e36-b' },
    ],
  },
  {
    id: 'skirts-r34',
    sku: 'UF-SKT/09',
    name: { ru: 'Пороги «НИЖЕ ПЛИНТУСА»', en: 'Side skirts "BELOW BASEBOARD"' },
    desc: {
      ru: 'Композитные накладки на пороги с аэрокромкой. Визуально -4 см клиренса, физически — чистый поток вдоль борта. Ставятся на штатные точки.',
      en: 'Composite side skirt extensions with an aero edge. Visually -4 cm ride height, physically — clean airflow down the side. Bolts to factory points.',
    },
    price: 540,
    weightGrams: 4200,
    heatC: 140,
    rarity: 'composite',
    material: { ru: 'Стеклокомпозит ручной укладки', en: 'Hand-laid fibreglass composite' },
    fits: ['nissan-gtr-r34', 'toyota-supra-a80', 'nissan-silvia-s15', 'bmw-e36', 'honda-civic-ek9'],
    media: [
      { type: 'image', url: part('nissan-gtr-r34', 'skirts-r34', 'composite', 1), seed: 'skirts-r34-a' },
      { type: 'image', url: part('nissan-gtr-r34', 'skirts-r34', 'composite', 2), seed: 'skirts-r34-b' },
    ],
  },
  {
    id: 'wing-lada',
    sku: 'UF-WNG/10',
    name: { ru: 'Спойлер «СЕМЁРКА-СЭНСЭЙ»', en: 'Spoiler "SEVEN SENSEI"' },
    desc: {
      ru: 'Низкий утиный спойлер на ВАЗ-2107 из АБС-пластика. Грунт под покраску в цвет кузова. Дед не поймёт, дрифт-комьюнити зауважает.',
      en: 'Low ABS duckbill spoiler for the LADA 2107. Primed and ready for body-colour paint. Grandpa won\'t get it, the drift community will.',
    },
    price: 250,
    weightGrams: 1900,
    heatC: 90,
    rarity: 'abs',
    material: { ru: 'АБС + грунт под покраску', en: 'ABS + paint-ready primer' },
    fits: ['lada-2107'],
    media: [
      { type: 'image', url: part('lada-2107', 'wing-lada', 'abs', 1), seed: 'wing-lada-a' },
      { type: 'image', url: part('lada-2107', 'wing-lada', 'abs', 2), seed: 'wing-lada-b' },
    ],
    hit: true,
  },
  {
    id: 'mirrors-aero',
    sku: 'UF-MIR/11',
    name: { ru: 'Зеркала «APEX VIEW»', en: 'Mirrors "APEX VIEW"' },
    desc: {
      ru: 'Карбоновые аэро-зеркала на капле-ноге: минус сопротивление, минус вес, плюс обзор через выпуклое синее стекло. Минус 400 грамм с пары.',
      en: 'Carbon aero mirrors on teardrop stalks: less drag, less weight, more vision through convex blue glass. Minus 400 grams per pair.',
    },
    price: 460,
    weightGrams: 1200,
    heatC: 180,
    rarity: 'carbon',
    material: { ru: 'Карбон 2×2 твил, синее стекло', en: '2×2 twill carbon, blue convex glass' },
    fits: ['nissan-silvia-s15', 'toyota-ae86', 'honda-civic-ek9', 'mazda-rx7-fd', 'bmw-e36', 'toyota-supra-a80', 'nissan-gtr-r34', 'lada-2107'],
    media: [
      { type: 'image', url: part('nissan-silvia-s15', 'mirrors-aero', 'carbon', 1), seed: 'mirrors-aero-a' },
      { type: 'image', url: part('nissan-silvia-s15', 'mirrors-aero', 'carbon', 2), seed: 'mirrors-aero-b' },
    ],
  },
  {
    id: 'kit-full-supra',
    sku: 'UF-KIT/12',
    name: { ru: 'Полный обвес «2JZ ARMOR»', en: 'Full kit "2JZ ARMOR"' },
    desc: {
      ru: 'Полный обвес на Supra A80: бампера, пороги, арки. Стеклокомпозит ручной укладки с усилением в точках крепежа — держит удар лучше заводского пластика.',
      en: 'Full A80 Supra kit: bumpers, skirts, arches. Hand-laid fibreglass composite reinforced at every mounting point — takes hits better than OEM plastic.',
    },
    price: 2400,
    weightGrams: 9000,
    heatC: 140,
    rarity: 'composite',
    material: { ru: 'Стеклокомпозит ручной укладки', en: 'Hand-laid fibreglass composite' },
    fits: ['toyota-supra-a80'],
    media: [
      { type: 'image', url: part('toyota-supra-a80', 'kit-full-supra', 'composite', 1), seed: 'kit-full-supra-a' },
      { type: 'image', url: part('toyota-supra-a80', 'kit-full-supra', 'composite', 2), seed: 'kit-full-supra-b' },
    ],
  },
];

/** Hero/background video candidates — first reachable one wins, otherwise animated fallback. */
export const HERO_VIDEOS = [
  // монтаж ночных эпизодов со всеми тачками каталога (сгенерировано Higgsfield
  // kling3_0_turbo, лежат локально): старт со случайного, дальше по кругу
  '/media/hero/hero-drift.mp4',
  '/media/hero/hero-s15-street.mp4',
  '/media/hero/hero-burnout.mp4',
  '/media/hero/hero-supra-round.mp4',
  '/media/hero/hero-rx7-flames.mp4',
  '/media/hero/hero-race.mp4',
  '/media/hero/hero-ae86-ramp.mp4',
  '/media/hero/hero-e36-dock.mp4',
  '/media/hero/hero-ek9-rain.mp4',
  '/media/hero/hero-r34-apron.mp4',
  '/media/hero/hero-tandem.mp4',
  '/media/hero/hero-drag.mp4',
  '/media/hero/hero-lada-barrel.mp4',
  // агрессивная серия: slow-mo прыжки, снос препятствий, стены и фуры
  '/media/hero/hero-jump-overpass.mp4',
  '/media/hero/hero-barrels.mp4',
  '/media/hero/hero-boxes.mp4',
  '/media/hero/hero-railroad.mp4',
  '/media/hero/hero-canal-wall.mp4',
  '/media/hero/hero-water-spray.mp4',
  '/media/hero/hero-gate.mp4',
  '/media/hero/hero-tandem-clip.mp4',
  '/media/hero/hero-dock-jump.mp4',
  '/media/hero/hero-trucks-180.mp4',
  '/media/hero/hero-ev-drag-crash.mp4',
  // легенды: известные тачки в разных сценах и с разных камер (v0.19.0)
  '/media/hero/hero-mustang-burnout.mp4',
  '/media/hero/hero-lambo-tunnel.mp4',
  '/media/hero/hero-gwagen-port-drift.mp4',
  '/media/hero/hero-porsche-fog-touge.mp4',
  '/media/hero/hero-f40-desert-night.mp4',
  '/media/hero/hero-muscle-launch-rain.mp4',
  '/media/hero/hero-gtr-kerbs-dawn.mp4',
  '/media/hero/hero-lemans-classic.mp4',
  '/media/hero/hero-mclaren-neon-rain.mp4',
  '/media/hero/hero-rally-night-jump.mp4',
  // экшн-серия: погони, трюки и опасные моменты на скорости (v0.19.0)
  '/media/hero/hero-police-pursuit.mp4',
  '/media/hero/hero-barrier-sparks.mp4',
  '/media/hero/hero-garage-spiral.mp4',
  '/media/hero/hero-canyon-duel.mp4',
  '/media/hero/hero-snow-pass.mp4',
  '/media/hero/hero-airfield-topspeed.mp4',
  '/media/hero/hero-drawbridge-jump.mp4',
  '/media/hero/hero-rain-dashcam.mp4',
  '/media/hero/hero-container-slalom.mp4',
  '/media/hero/hero-sandstorm-run.mp4',
  '/media/hero/hero-tunnel-weave.mp4',
  '/media/hero/hero-bridge-crosswind.mp4',
  '/media/hero/hero-tire-blowout.mp4',
  '/media/hero/hero-cockpit-redline.mp4',
  '/media/hero/hero-drag-trio.mp4',
  '/media/hero/hero-dunes-trophy.mp4',
  '/media/hero/hero-oldtown-chase.mp4',
  '/media/hero/hero-barrel-dodge.mp4',
  '/media/hero/hero-vintage-pack.mp4',
];
