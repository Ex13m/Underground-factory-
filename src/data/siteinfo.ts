import type { LocalText } from '../lib/types';

/**
 * Справка «ИНФО» в админке: технологии, связи, модели генерации, планы.
 * ПРАВИЛО: обновлять при заметных изменениях стека/планов и после каждой
 * большой генерации (остаток кредитов Higgsfield — вручную, с датой замера).
 */

export const HF_CREDITS = {
  value: '≈1225',
  /** реально израсходовано на проект с 2026-07-08 (сумма spend из биллинга Higgsfield) */
  spent: '≈815',
  measuredAt: '2026-07-09',
  plan: 'Ultimate',
};

/**
 * Накопительные датчики расхода на проект (шапка + Инфо).
 * Higgsfield — точно из биллинга (transactions); HeyGen — пока не использовался;
 * Claude Code — оценка (точного счётчика у сессий нет): вход+выход с учётом
 * кэша за все сессии разработки с 2026-07-08. Обновляется с релизами.
 */
export const SPEND_METERS = [
  { id: 'hf', label: 'HIGGSFIELD', spent: '≈815', unit: { ru: 'кредитов', en: 'credits' }, exact: true },
  { id: 'heygen', label: 'HEYGEN', spent: '0', unit: { ru: 'кредитов', en: 'credits' }, exact: true },
  { id: 'claude', label: 'CLAUDE CODE', spent: '≈25M', unit: { ru: 'токенов (оценка)', en: 'tokens (estimate)' }, exact: false },
] as const;

export interface InfoSection {
  title: LocalText;
  items: LocalText[];
}

export const SITE_INFO: InfoSection[] = [
  {
    title: { ru: 'В работе', en: 'In progress' },
    items: [
      { ru: 'Исполнение заявок из серверной очереди /api/queue («Заказать ▸ Higgsfield»)', en: 'Serving tickets from the /api/queue server queue ("Order ▸ Higgsfield")' },
      { ru: 'Микро-плеер: доводка по отзывам (кроссфейды, плейлист)', en: 'Micro player: polish per feedback (crossfades, playlist)' },
    ],
  },
  {
    title: { ru: 'В планах', en: 'Planned' },
    items: [
      { ru: 'Higgsfield Cloud API в серверную функцию (ключи HF_API_KEY/HF_API_SECRET в Netlify)', en: 'Higgsfield Cloud API inside the serverless function (HF_API_KEY/HF_API_SECRET env)' },
      { ru: 'Replicate в /api/generate (ключ REPLICATE_API_TOKEN в Netlify) — автономная качественная генерация', en: 'Replicate in /api/generate (REPLICATE_API_TOKEN env) — autonomous quality generation' },
      { ru: 'Переезд видео на внешний CDN (Cloudflare R2) — ждёт аккаунта; после пережатия (все ролики ~76 МБ) не срочно', en: 'Video move to external CDN (Cloudflare R2) — awaiting account; not urgent after recompression (~76 MB total)' },
      { ru: 'Настоящие Stripe и OAuth вместо заглушек (заменой адаптеров, см. API.md)', en: 'Real Stripe and OAuth instead of stubs (adapter swap, see API.md)' },
    ],
  },
  {
    title: { ru: 'Технологии', en: 'Tech stack' },
    items: [
      { ru: 'Vite + React 18 + TypeScript, zustand (persist), HashRouter', en: 'Vite + React 18 + TypeScript, zustand (persist), HashRouter' },
      { ru: 'Прототип без бэкенда: localStorage/IndexedDB-оверлеи поверх сида, контракт window.UF_API (API.md)', en: 'No-backend prototype: localStorage/IndexedDB overlays over the seed, window.UF_API contract (API.md)' },
      { ru: 'Netlify: автодеплой из ветки, Functions (/api/generate, /api/queue) + Blobs', en: 'Netlify: branch auto-deploy, Functions (/api/generate, /api/queue) + Blobs' },
      { ru: 'Медиа-хранилище public/media: тачка → детали → материал (манифест MEDIA.md)', en: 'public/media storage: car → parts → material (MEDIA.md manifest)' },
    ],
  },
  {
    title: { ru: 'Связи и интеграции', en: 'Links & integrations' },
    items: [
      { ru: 'GitHub: github.com/Ex13m/Underground-factory- (ветка claude/car-tuning-shop-z39a5s)', en: 'GitHub: github.com/Ex13m/Underground-factory- (branch claude/car-tuning-shop-z39a5s)' },
      { ru: 'Прод: incandescent-paletas-b62698.netlify.app', en: 'Prod: incandescent-paletas-b62698.netlify.app' },
      { ru: 'Higgsfield MCP в сессии Claude Code — весь сгенерированный контент сайта', en: 'Higgsfield MCP inside the Claude Code session — all generated site content' },
      { ru: 'Браузерная генерация: Pollinations (без ключа) / GPT Image, Nano Banana 2 (по своим ключам)', en: 'In-browser generation: Pollinations (keyless) / GPT Image, Nano Banana 2 (own keys)' },
    ],
  },
];

export interface ModelRow {
  model: string;
  usage: LocalText;
}

export const GEN_MODELS: ModelRow[] = [
  { model: 'Higgsfield Soul Cinema (soul_cinematic)', usage: { ru: 'фото тачек: гаражная серия и дрифт (2048×1152)', en: 'car photos: garage & drift series (2048×1152)' } },
  { model: 'Nano Banana 2 (nano_banana_2)', usage: { ru: 'предметка деталей «в воздухе» (4:3, 1K)', en: 'floating part product shots (4:3, 1K)' } },
  { model: 'Kling 3.0 Turbo (kling3_0_turbo)', usage: { ru: 'все видео: hero-эпизоды, «оживление» тачек (image-to-video), производство материалов (16:9, 720p, 5 с)', en: 'all video: hero episodes, car "come alive" (image-to-video), material process (16:9, 720p, 5 s)' } },
  { model: 'Replicate flux-schnell', usage: { ru: 'серверная функция /api/generate (после установки ключа)', en: '/api/generate serverless (once the key is set)' } },
  { model: 'Pollinations flux', usage: { ru: 'бесплатная генерация в арт-редакторе (по прямой ссылке)', en: 'free art-editor generation (direct URL)' } },
];
