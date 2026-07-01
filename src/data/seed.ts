import type { CarModel, Product } from '../lib/types';

/**
 * Seed catalog. Live catalog = seed + admin additions (localStorage overlay), see lib/api.ts.
 * Image URLs are hot-linked stock photos; every consumer must render them through
 * lib/media.tsx so an unreachable URL falls back to generated decal art.
 */

const u = (id: string, w = 1400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

export const SEED_CARS: CarModel[] = [
  { id: 'nissan-silvia-s15', make: 'Nissan', model: 'Silvia S15', years: '1999–2002', img: u('1511919884226-fd3cad34687c') },
  { id: 'toyota-supra-a80', make: 'Toyota', model: 'Supra A80', years: '1993–2002', img: u('1525609004556-c46c7d6cf023') },
  { id: 'mazda-rx7-fd', make: 'Mazda', model: 'RX-7 FD', years: '1992–2002', img: u('1502877338535-766e1452684a') },
  { id: 'toyota-ae86', make: 'Toyota', model: 'AE86 Trueno', years: '1983–1987', img: u('1471444928139-48c5bf5173f8') },
  { id: 'bmw-e36', make: 'BMW', model: 'E36 Coupe', years: '1990–2000', img: u('1493238792000-8113da705763') },
  { id: 'honda-civic-ek9', make: 'Honda', model: 'Civic EK9', years: '1997–2000', img: u('1605559424843-9e4c228bf1c2') },
  { id: 'nissan-gtr-r34', make: 'Nissan', model: 'Skyline R34', years: '1999–2002', img: u('1542282088-fe8426682b8f') },
  { id: 'lada-2107', make: 'LADA', model: '2107', years: '1982–2012', img: u('1583121274602-3e2820c69888') },
];

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'kit-widebody-s15',
    sku: 'UF-KIT/01',
    name: { ru: 'Widebody «ПАПИР-БАНЯ»', en: 'Widebody "PAPER SAUNA"' },
    desc: {
      ru: 'Расширители арок из трёхслойной гофры. +30 см ширины, +300% взглядов на парковке. Установка на двусторонний скотч — входит в комплект.',
      en: 'Triple-layer corrugated arch flares. +30 cm width, +300% parking lot stares. Mounts on double-sided tape — included.',
    },
    price: 449,
    weightGrams: 820,
    rainMinutes: 12,
    rarity: 'corrugated',
    material: { ru: 'Гофрокартон 3 слоя', en: '3-ply corrugated board' },
    fits: ['nissan-silvia-s15', 'nissan-gtr-r34'],
    media: [
      { type: 'image', url: u('1511919884226-fd3cad34687c'), seed: 'kit-widebody-s15-a' },
      { type: 'image', url: u('1493238792000-8113da705763'), seed: 'kit-widebody-s15-b' },
    ],
    hit: true,
  },
  {
    id: 'wing-gt-supra',
    sku: 'UF-WNG/02',
    name: { ru: 'Антикрыло «СТОЛЕШНИЦА GT»', en: 'GT Wing "TABLETOP"' },
    desc: {
      ru: 'Двухэтажное антикрыло из фанеры 8 мм. Прижимная сила отрицательная, зато слышно, как уважение прижимает. Крепёж — саморезы по дереву.',
      en: 'Two-storey 8mm plywood GT wing. Downforce is negative, but you can hear the respect pressing down. Wood screws included.',
    },
    price: 289,
    weightGrams: 1400,
    rainMinutes: 90,
    rarity: 'plywood',
    material: { ru: 'Фанера берёзовая 8 мм', en: '8mm birch plywood' },
    fits: ['toyota-supra-a80', 'bmw-e36', 'nissan-gtr-r34'],
    media: [
      { type: 'image', url: u('1525609004556-c46c7d6cf023'), seed: 'wing-gt-supra-a' },
      { type: 'image', url: u('1542282088-fe8426682b8f'), seed: 'wing-gt-supra-b' },
    ],
    hit: true,
  },
  {
    id: 'splitter-rx7',
    sku: 'UF-SPL/03',
    name: { ru: 'Сплиттер «НОЖ ХЛЕБНЫЙ»', en: 'Splitter "BREAD KNIFE"' },
    desc: {
      ru: 'Передний сплиттер из картона от холодильника. Аэродинамика уровня «ну вроде ниже стал». Царапается об каждый лежачий полицейский — как настоящий.',
      en: 'Front splitter cut from a fridge box. Aero level: "looks lower I guess". Scrapes on every speed bump — just like the real thing.',
    },
    price: 129,
    weightGrams: 340,
    rainMinutes: 6,
    rarity: 'cardboard',
    material: { ru: 'Картон от холодильника Bosch', en: 'Bosch fridge box cardboard' },
    fits: ['mazda-rx7-fd', 'nissan-silvia-s15', 'honda-civic-ek9'],
    media: [
      { type: 'image', url: u('1502877338535-766e1452684a'), seed: 'splitter-rx7-a' },
    ],
  },
  {
    id: 'diffuser-chrome',
    sku: 'UF-DIF/04',
    name: { ru: 'Диффузор «СКОТЧ-ХРОМ ULTIMATE»', en: 'Diffuser "CHROME TAPE ULTIMATE"' },
    desc: {
      ru: 'Задний диффузор, обклеенный армированным скотчем с хром-эффектом. Блестит как титан, весит как пицца. Ламинирован — дождь ему почти безразличен.',
      en: 'Rear diffuser wrapped in chrome-effect duct tape. Shines like titanium, weighs like a pizza. Laminated — rain barely cares.',
    },
    price: 359,
    weightGrams: 610,
    rainMinutes: 240,
    rarity: 'chrome-tape',
    material: { ru: 'Картон + скотч-хром 3M', en: 'Cardboard + 3M chrome tape' },
    fits: ['bmw-e36', 'nissan-gtr-r34', 'toyota-supra-a80'],
    media: [
      { type: 'image', url: u('1542282088-fe8426682b8f'), seed: 'diffuser-chrome-a' },
      { type: 'image', url: u('1552519507-da3b142c6e3d'), seed: 'diffuser-chrome-b' },
    ],
    hit: true,
  },
  {
    id: 'kit-wet-legend',
    sku: 'UF-LGD/05',
    name: { ru: 'Полный обвес «МОКРЫЙ КАРТОН»', en: 'Full kit "WET CARDBOARD"' },
    desc: {
      ru: 'Легендарный полный обвес, однажды переживший ливень. Больше он этого не повторит. Единственный экземпляр с аурой. Сертификат выжившего прилагается.',
      en: 'The legendary full kit that once survived a downpour. It will not do it again. One-of-one, comes with an aura and a survivor certificate.',
    },
    price: 1999,
    weightGrams: 2900,
    rainMinutes: 4,
    rarity: 'wet-cardboard',
    material: { ru: 'Картон, закалённый дождём', en: 'Rain-tempered cardboard' },
    fits: ['toyota-ae86', 'nissan-silvia-s15', 'mazda-rx7-fd'],
    media: [
      { type: 'image', url: u('1471444928139-48c5bf5173f8'), seed: 'kit-wet-legend-a' },
      { type: 'image', url: u('1511919884226-fd3cad34687c'), seed: 'kit-wet-legend-b' },
    ],
    hit: true,
  },
  {
    id: 'lip-ae86',
    sku: 'UF-LIP/06',
    name: { ru: 'Губа «ТОФУ ДЕЛИВЕРИ»', en: 'Front lip "TOFU DELIVERY"' },
    desc: {
      ru: 'Передняя губа для хачироку. Вырезана по лекалам, снятым с коробки из-под тофу. Канонично. Не мочить дважды.',
      en: 'Front lip for the hachi-roku. Cut from patterns traced off a tofu box. Canon. Do not wet twice.',
    },
    price: 99,
    weightGrams: 260,
    rainMinutes: 8,
    rarity: 'cardboard',
    material: { ru: 'Картон коробки тофу', en: 'Tofu box cardboard' },
    fits: ['toyota-ae86'],
    media: [{ type: 'image', url: u('1471444928139-48c5bf5173f8'), seed: 'lip-ae86-a' }],
  },
  {
    id: 'canards-civic',
    sku: 'UF-CNR/07',
    name: { ru: 'Канарды «УШКИ АГРЕССИИ»', en: 'Canards "AGGRO FINS"' },
    desc: {
      ru: 'Комплект из 4 канардов из гофры. Аэродинамического смысла ноль, агрессии — максимум. Клей-момент в комплекте.',
      en: 'Set of 4 corrugated canards. Zero aero effect, maximum aggression. Super glue included.',
    },
    price: 79,
    weightGrams: 120,
    rainMinutes: 10,
    rarity: 'corrugated',
    material: { ru: 'Гофрокартон 2 слоя', en: '2-ply corrugated board' },
    fits: ['honda-civic-ek9', 'nissan-silvia-s15', 'mazda-rx7-fd'],
    media: [{ type: 'image', url: u('1605559424843-9e4c228bf1c2'), seed: 'canards-civic-a' }],
  },
  {
    id: 'hood-vents-e36',
    sku: 'UF-HOD/08',
    name: { ru: 'Капот «ДЫШИ ГЛУБЖЕ»', en: 'Vented hood "BREATHE DEEP"' },
    desc: {
      ru: 'Накладка на капот с вентиляцией из фанеры. Отверстия прорезаны лобзиком с любовью. Мотору не поможет, фоткам — очень.',
      en: 'Plywood vented hood overlay. Holes jigsawed with love. Won\'t help the engine, will help the photos a lot.',
    },
    price: 249,
    weightGrams: 1100,
    rainMinutes: 60,
    rarity: 'plywood',
    material: { ru: 'Фанера 6 мм + морилка', en: '6mm plywood + wood stain' },
    fits: ['bmw-e36'],
    media: [{ type: 'image', url: u('1493238792000-8113da705763'), seed: 'hood-vents-e36-a' }],
  },
  {
    id: 'skirts-r34',
    sku: 'UF-SKT/09',
    name: { ru: 'Пороги «НИЖЕ ПЛИНТУСА»', en: 'Side skirts "BELOW BASEBOARD"' },
    desc: {
      ru: 'Накладки на пороги из гофры с хром-кантом. Визуально -4 см клиренса. Физически тоже, если наехать на лужу.',
      en: 'Corrugated side skirts with chrome edging. Visually -4 cm ride height. Physically too, if you hit a puddle.',
    },
    price: 189,
    weightGrams: 540,
    rainMinutes: 15,
    rarity: 'corrugated',
    material: { ru: 'Гофра + хром-кант', en: 'Corrugated + chrome edge' },
    fits: ['nissan-gtr-r34', 'toyota-supra-a80'],
    media: [{ type: 'image', url: u('1542282088-fe8426682b8f'), seed: 'skirts-r34-a' }],
  },
  {
    id: 'wing-lada',
    sku: 'UF-WNG/10',
    name: { ru: 'Спойлер «СЕМЁРКА-СЭНСЭЙ»', en: 'Spoiler "SEVEN SENSEI"' },
    desc: {
      ru: 'Низкий утиный спойлер на ВАЗ-2107. Картон, покрытый скотч-хромом. Дед не поймёт, дрифт-комьюнити зауважает.',
      en: 'Low duckbill spoiler for the LADA 2107. Chrome-taped cardboard. Grandpa won\'t get it, the drift community will.',
    },
    price: 149,
    weightGrams: 380,
    rainMinutes: 180,
    rarity: 'chrome-tape',
    material: { ru: 'Картон + скотч-хром', en: 'Cardboard + chrome tape' },
    fits: ['lada-2107'],
    media: [{ type: 'image', url: u('1583121274602-3e2820c69888'), seed: 'wing-lada-a' }],
    hit: true,
  },
  {
    id: 'mirrors-aero',
    sku: 'UF-MIR/11',
    name: { ru: 'Зеркала «СЛЕПАЯ ЗОНА 360°»', en: 'Mirrors "BLIND SPOT 360°"' },
    desc: {
      ru: 'Аэро-зеркала из картона с фольгой вместо стекла. Видно примерно ничего, зато минус 200 грамм с каждой стороны.',
      en: 'Cardboard aero mirrors with foil instead of glass. You see approximately nothing, but minus 200 grams per side.',
    },
    price: 59,
    weightGrams: 90,
    rainMinutes: 7,
    rarity: 'cardboard',
    material: { ru: 'Картон + фольга пищевая', en: 'Cardboard + kitchen foil' },
    fits: ['nissan-silvia-s15', 'toyota-ae86', 'honda-civic-ek9', 'mazda-rx7-fd', 'bmw-e36', 'toyota-supra-a80', 'nissan-gtr-r34', 'lada-2107'],
    media: [{ type: 'image', url: u('1552519507-da3b142c6e3d'), seed: 'mirrors-aero-a' }],
  },
  {
    id: 'kit-full-supra',
    sku: 'UF-KIT/12',
    name: { ru: 'Полный обвес «2JZ-БУМАГА»', en: 'Full kit "2JZ-PAPER"' },
    desc: {
      ru: 'Полный обвес на Supra A80: бампера, пороги, арки. Гофра повышенной плотности, швы проклеены серым скотчем — как с завода.',
      en: 'Full A80 Supra kit: bumpers, skirts, arches. High-density corrugated board, seams sealed with grey duct tape — factory grade.',
    },
    price: 899,
    weightGrams: 2400,
    rainMinutes: 20,
    rarity: 'corrugated',
    material: { ru: 'Гофра высокой плотности', en: 'High-density corrugated' },
    fits: ['toyota-supra-a80'],
    media: [
      { type: 'image', url: u('1525609004556-c46c7d6cf023'), seed: 'kit-full-supra-a' },
      { type: 'image', url: u('1552519507-da3b142c6e3d'), seed: 'kit-full-supra-b' },
    ],
  },
];

/** Hero/background video candidates — first reachable one wins, otherwise animated fallback. */
export const HERO_VIDEOS = [
  'https://assets.mixkit.co/videos/preview/mixkit-driver-drifting-in-a-car-race-42542-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-sports-car-driving-on-a-highway-41576-large.mp4',
  'https://videos.pexels.com/video-files/4568563/4568563-hd_1920_1080_30fps.mp4',
];
