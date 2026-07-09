# UNDERGROUND FACTORY — инструкции для Claude Code

Магазин тюнинг-обвесов (карбон / композит / АБС) для JDM-тачек. Прототип без бэкенда.
**Прежде чем что-то делать — прочитай `HANDOFF.md`: там статус проекта и текущая задача.**

## Команды
- `npm install` — зависимости
- `npm run dev` — dev-сервер (http://localhost:5173)
- `npm run build` — прод-сборка (tsc + vite), должна проходить чисто
- `npm run typecheck` — только типы

## Правило проверки (verify before build)
Перед сдачей любого изменения: опиши, как проверишь результат, потом проверь реально —
`npm run build` + прогон в браузере (сквозной сценарий: каталог → товар → корзина →
промокод → checkout `4242 4242 4242 4242` → заказ виден в кабинете; админка добавляет
товар → он в каталоге; RU↔EN; курсор-флажок с машинкой; бот отвечает).

## Архитектура
- **Стек**: Vite + React 18 + TypeScript, react-router (HashRouter), zustand (persist в localStorage).
- **`src/lib/api.ts`** — слой данных `UF_API` (localStorage-оверлей поверх сида, REST-фасад,
  экспонирован как `window.UF_API`). Реальный Stripe/OAuth подключаются заменой адаптеров — см. `API.md`.
- **`src/data/seed.ts`** — сид-каталог (12 обвесов, 8 тачек). id товаров НЕ менять (на них завязаны тесты).
- **`src/store/`** — zustand: catalog, cart (промокоды), auth (юзер+гараж+заказы+избранное), ui (язык/calm/подсказки).
- **`src/lib/i18n.tsx`** + `src/i18n/*.ts` — RU/EN словари по неймспейсам; все видимые строки только через `t()`/`lt()`, полный паритет ru/en.
- **`src/lib/bus.ts`** — шина событий (бот, подсказки, FX); список событий в шапке файла.
- **`src/lib/media.tsx`** — ВСЕ картинки через `<Img src seed/>`, видео через `<VideoBg/>`:
  при недоступном URL рендерится сгенерированный SVG-арт. Не использовать голый `<img>`.
- **`src/fx/`** — курсор-флажок + дрифт-машинка (canvas) и BootIntro; отключаются в calm-режиме,
  на тач-устройствах и при prefers-reduced-motion. BootIntro скипается при `navigator.webdriver`.
- **`src/bot/`** — бот-продавец «ПИТ-БОСС» (rule-based, эскалация скидок CARBON5→CARBON10→PITSTOP15,
  коды реально регистрируются через `api.registerPromo`) + Coachmarks (подсказки, one-shot через `useUI.seenHints`).
- **Дизайн-система** — `src/styles/global.css`: токены (`--void`, `--blood #e01b22`, `--paper`…),
  классы `.panel/.tape/.barcode/.stencil/.btn/.field/.rarity/.zig` и пр. Стиль: кибер-индустриальный
  техвир, красный/чёрный/грязно-белый, HUD-пластины со срезанными углами. Токены Stitch — `design_tokens` в HANDOFF.

## Данные/состояние
Всё в localStorage (`uf:*`). Сброс стенда: очистить localStorage.

## Деплой и ветки
Основная ветка — `main` (default на GitHub). Netlify пока собирает прод из
старой ветки `claude/car-tuning-shop-z39a5s`, поэтому КАЖДЫЙ пуш зеркалится
в обе: `git push origin main && git push origin main:claude/car-tuning-shop-z39a5s`.
Когда пользователь переключит Netlify (Build & deploy → Production branch →
main) — зеркалить перестать. Прод: https://incandescent-paletas-b62698.netlify.app

## Версионирование и история изменений (обязательно)
Перед КАЖДЫМ пушем в ветку деплоя:
1. Бамп версии в `package.json` (SemVer: фичи → minor, правки → patch).
2. Запись в `CHANGELOG.md` — что добавлено/изменено/убрано, по-русски.
3. Для minor-версий обновить `src/data/updates.ts` — 3-5 коротких строк
   «что поменялось» (RU/EN): их показывает бегущий анонс обновлений
   (fx/UpdatesTicker) один раз каждому посетителю. Для patch-фиксов
   анонс не трогаем (не спамим посетителям мелочами).
Версия и дата сборки автоматически попадают в футер сайта (vite define
`__APP_VERSION__` / `__BUILD_DATE__` в vite.config.ts). Коммиты — осмысленные,
одна тема = один коммит.

## Генерация медиа (Higgsfield — исполняет Claude в терминале)
Весь AI-контент сайта генерируется через Higgsfield MCP в сессии Claude Code:
- картинки тачек/дрифта — модель `soul_cinematic`; предметка «деталь в воздухе» — `nano_banana_2` (4:3);
- видео (hero-эпизоды, «оживление» тачек по фото через start_image, производство материалов) — `kling3_0_turbo` (16:9, 5 с);
- файлы кладутся в `public/img/gen/` (JPEG ≤1600px) и `public/video/`, пути прописываются в `src/data/seed.ts`/`materials.ts`.
Заявки админа: арт-редактор → «Заказать ▸ Higgsfield» → заявка автоматически
уходит на сервер сайта (Netlify Blobs). Claude забирает их из терминала:
`GET https://incandescent-paletas-b62698.netlify.app/api/queue`, исполняет
(генерирует, кладёт файлы в public/media, прописывает в seed, пушит) и чистит
очередь `DELETE /api/queue`. Запасной путь — выгрузка gen-queue.json из
Админки → АРТ. Промпт в заявке может быть авто-собранным (см. autoPrompt).
Заявки с `kind: 'scrap-video'` (кнопка «БРАК» в Админке → «Эфир») — это брак:
удалить файл из `key` (путь вида /media/hero/*.mp4) из репозитория и вычистить
его из `HERO_VIDEOS` (seed.ts) и `TV_CLIPS` (tv.ts).
Прочие kind заявок: `trim-video`/`trim-audio` — обрезать файл ffmpeg-ом до
[start, end]; `add-track` — скачать mp3 из GET /api/track?name= и положить в
public/media/music + playlist.ts; `stems-audio` — разложить трек на стемы;
`reel` — собрать рилс 9:16 по JSON из prompt СТРОГО по `BRANDBOOK.md`
(хук от кульминации → биты → CTA, клипы Higgsfield 720×1280, сборка ffmpeg
с музыкой и глитч-титрами, звук оставить aac 128k), файл в public/media/reels/,
запись в src/data/reels.ts (полка в Админке → Контент). Правила монтажа рилсов:
динамическая нарезка ~12 склеек по ~2 с; каждый сегмент нормализовать
`scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280`; титры
Impact с прыжками размера + красно-синие глитч-вспышки и полосы помех
(образец — scratchpad reel/filter6.txt прошлых сессий, паттерн в git-истории);
разделитель в титрах `//` (глиф ▸ в Impact ненадёжен). ЗАПРЕТ: кадры 16:9
внутри вертикальной рамки (letterbox/полосы/лежачая сцена) — брак, клип
перегенерить; в промптах всегда «tall vertical composition, camera strictly
upright, no letterboxing, no black bars». Если в брифе
customCar.photoRef — забрать фото GET /api/track?name=<ref> и генерить клипы
image-to-video (kling, medias role start_image) от этого фото. Если имя тачки
пустое или 'CUSTOM' — РАСПОЗНАТЬ машину по фото самостоятельно (марка, модель,
поколение, цвет, диски, детали), составить «паспорт» в стиле сайта (сленг цеха)
и использовать его дословно во всех промптах клипов и в титрах. Промокод из CTA
должен существовать в BUILTIN_PROMOS (api.ts) — добавить, если новый.
Все mp4 перед коммитом жать: `ffmpeg -an -c:v libx264 -preset slow -crf 25
-movflags +faststart -pix_fmt yuv420p` (видео на сайте всегда muted).

## Процесс работы с задачами (spec-pilot)
Порядок: интервью → спека → явное «да» пользователя → сборка (саб-агенты только ПОСЛЕ
утверждённой спеки) → самопроверка. Крупные правки дизайна/скоупа — сначала короткая спека
на подтверждение. Необратимое (оплата, удаление данных, прод) — только руками пользователя.
