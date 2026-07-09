# UNDERGROUND FACTORY 🏁

Магазин тюнинг-обвесов из карбона/композита/АБС для JDM-тачек.
Прототип без бэкенда: весь UX работает на localStorage/IndexedDB-оверлеях.
Дизайн — кибер-индустриальный техвир. Весь медиа-контент (30+ видео,
26+ фото) сгенерирован нейросетями и лежит в репозитории.

**Прод:** https://incandescent-paletas-b62698.netlify.app
**Копирайт:** © Gausse Holler Custom Lab

## Быстрый старт (с любого компа)

```bash
git clone https://github.com/Ex13m/Underground-factory-.git
cd Underground-factory-
npm install
npm run dev        # http://localhost:5173
```

Требуется Node 20+ (см. `.nvmrc`). Больше ничего: медиа, музыка и данные
уже в репозитории; внешних ключей для запуска не нужно.

## Скрипты

| Команда | Что делает |
| --- | --- |
| `npm run dev` | dev-сервер Vite |
| `npm run build` | прод-сборка (tsc + vite) — должна проходить чисто |
| `npm run typecheck` | только проверка типов |
| `npm run preview` | предпросмотр прод-сборки |

## Карта проекта

- `src/` — код (React 18 + TS + zustand); архитектура — в `CLAUDE.md`
- `public/media/` — медиа-хранилище: тачки → детали → материалы,
  hero-эпизоды, интро, музыка (манифест: `public/media/MEDIA.md`)
- `netlify/functions/` — serverless: `/api/generate` (Replicate),
  `/api/queue` (очередь заявок на генерацию, Netlify Blobs)
- `API.md` — контракт `window.UF_API` и хранилища
- `HANDOFF.md` — текущий статус и незакрытые нити
- `CHANGELOG.md` — история версий (версия видна в футере сайта)

## Деплой

Netlify собирает автоматически. Основная ветка — `main`; прод пока
слушает `claude/car-tuning-shop-z39a5s`, поэтому пуши зеркалятся в обе
(см. «Релизный чек-лист»). Опциональные ключи в Netlify env:
`REPLICATE_API_TOKEN` (серверная генерация картинок), в планах
`HF_API_KEY`/`HF_API_SECRET` (Higgsfield Cloud API).

## Релизный чек-лист (перед каждым пушем)

1. `npm run build` — чисто.
2. Бамп версии в `package.json` (SemVer).
3. Запись в `CHANGELOG.md` (по-русски).
4. Для minor: обновить `src/data/updates.ts` (бегущий анонс) и при
   необходимости `src/data/siteinfo.ts` (вкладка Инфо в админке).
5. `git push origin main && git push origin main:claude/car-tuning-shop-z39a5s`

## Админка

Ссылка в шапке видна при наведении; код доступа — `4174`.
Вкладки: Цех (дерево тачка→детали→материал), Обвесы, Тачки, Заказы,
Промо, Материалы, Обмен, Арт (арт-редактор и генерация), Инфо.
