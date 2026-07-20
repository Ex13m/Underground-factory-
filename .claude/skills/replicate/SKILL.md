---
name: replicate
description: "Доступ ко ВСЕМ моделям Replicate по API из любого проекта + самообучение. Тысячи нейросетей: картинки (FLUX.2, Ideogram v3, Recraft, SDXL), редактирование (FLUX Kontext), видео (Kling, Veo, Seedance, Wan, LTX, Hunyuan), image-to-3D и text-to-3D (TRELLIS 2, Hunyuan3D 3.1, Stable Fast 3D), апскейл/реставрация (Real-ESRGAN, GFPGAN, Clarity), аудио/музыка/TTS/транскрипция (MusicGen, Whisper), удаление фона, vision. Знает REST API (Bearer-токен, Prefer: wait), схемы моделей тянет вживую, держит базу лучших моделей по категориям и дописывает её. Триггеры: /replicate, «через replicate», «image-to-3D / картинка в 3D», «сгенерируй картинку/видео/музыку по api replicate», «апскейл/убери фон replicate», «обнови базу replicate»."
---

# REPLICATE MASTER — все модели по API + самообучение

Единый вход к каталогу Replicate (тысячи моделей: image, video, 3D, audio, upscale,
vision) в ЛЮБОМ проекте по REST API. База «лучших моделей по задачам» живёт в
`knowledge/` и растёт: схемы моделей тянутся вживую, каталог сверяется через API.
В отличие от `/higgsfield` (одна платформа, MCP-инструменты) — здесь голый HTTP к
открытой экосистеме моделей.

## 0. Предусловия (проверить один раз)

- Токен: переменная окружения `REPLICATE_API_TOKEN`. Проверка (PowerShell):
  `if (-not $env:REPLICATE_API_TOKEN) { "нет токена" }`. Если пусто — попросить
  пользователя выполнить в сессии `! setx REPLICATE_API_TOKEN "r8_..."` (или задать
  на время сессии `$env:REPLICATE_API_TOKEN="r8_..."`). Токен НЕ печатать в вывод.
- Оплата на аккаунте Replicate включена (генерация платная, посекундно/за-выход).

## 1. С чего начать КАЖДЫЙ раз

1. Прочитать `knowledge/INDEX.md` и `knowledge/models.md` — лучшие модели по категориям.
2. Есть рецепт в `knowledge/playbooks/` под задачу → идти по нему.
3. Не уверен, какая модель/слаг актуальны → сверить вживую (§2 «поиск»): каталог Replicate
   меняется, слаги и версии НЕ выдумывать.
4. Перед первым вызовом незнакомой модели — вытянуть её JSON-схему входа (§3), чтобы
   передать правильные поля `input`.

## 2. Поиск и выбор модели (каталог живой)

- Коллекции по темам (готовые подборки Replicate):
  `GET https://api.replicate.com/v1/collections/{slug}` — напр. `text-to-image`,
  `image-to-video`, `text-to-video`, `3d-models`, `upscale-images`, `super-resolution`,
  `text-to-speech`, `audio-generation`. Список коллекций: `/v1/collections`.
- Поиск по слову: `GET https://api.replicate.com/v1/models?search=<запрос>`.
- Быстрая сверка «что сейчас лучшее» — WebSearch по `replicate.com/collections/...` или
  странице модели; актуальные фавориты держим в `models.md`.

## 3. Схема модели (обязательно перед вызовом незнакомой)

`GET https://api.replicate.com/v1/models/{owner}/{name}` → в ответе
`latest_version.id` (нужен как `version`) и `latest_version.openapi_schema` с описанием
полей `input` (типы, дефолты, обязательность). Читать схему → собрать `input`.

## 4. Запуск генерации (два пути)

**A. Официальные модели** (owner — `black-forest-labs`, `google`, `tencent`, `ideogram-ai`
и т.п.) — по имени, без версии, синхронно:
```
POST https://api.replicate.com/v1/models/{owner}/{name}/predictions
Headers: Authorization: Bearer $REPLICATE_API_TOKEN
         Content-Type: application/json
         Prefer: wait            # держать соединение до готовности (дефолт 60с; Prefer: wait=300)
Body:    {"input": { ... }}
```
**B. Комьюнити-модели** — по версии:
```
POST https://api.replicate.com/v1/predictions
Body: {"version":"<latest_version.id>", "input":{ ... }}
```
Ответ: объект prediction. С `Prefer: wait` часто сразу `status:"succeeded"` и `output`
(URL или массив URL). Если вернулось `starting`/`processing` — поллить
`GET /v1/predictions/{id}` каждые 2–5 с до `succeeded`/`failed`.

### PowerShell (основная среда, Windows)
```powershell
$h = @{ Authorization = "Bearer $env:REPLICATE_API_TOKEN"; "Prefer" = "wait" }
$body = @{ input = @{ prompt = "..." } } | ConvertTo-Json -Depth 8
$r = Invoke-RestMethod -Method Post -Headers $h -ContentType "application/json" `
  -Uri "https://api.replicate.com/v1/models/black-forest-labs/flux-2-pro/predictions" -Body $body
$r.output   # URL(ы) результата
```
Скачать результат в проект: `Invoke-WebRequest $r.output -OutFile out.png` (для массива —
по элементам). Bash-инструмент с `curl` тоже доступен — см. `knowledge/api.md`.

## 5. Медиа-вход

- Replicate принимает во `input` **публичные https-URL** ИЛИ **data-URI (base64)**.
- Локальный файл → base64 data-URI: PowerShell
  `"data:image/png;base64," + [Convert]::ToBase64String([IO.File]::ReadAllBytes($p))`.
- Выход одной модели (URL) можно сразу подавать во вход следующей (цепочки:
  txt→image → image→3D, или image → upscale → remove-bg).

## 6. САМООБУЧЕНИЕ — база лучших моделей растёт

1. Разбирая новую задачу/модель: вытянуть её схему (§3), проверить коллекцию (§2),
   при желании — WebSearch «best Replicate <категория> 2026».
2. Записать в базу: обновить `knowledge/models.md` (слаг, что делает, когда брать,
   ключевые поля input, ≈цена), при частой задаче — рецепт в `knowledge/playbooks/`,
   строку-указатель в `knowledge/INDEX.md`. Помечать дату и уверенность.
3. Дедупликация: перед записью читать INDEX; дополнять существующее, не плодить дубли.
4. В базу — только то, что реально помогает выбрать/вызвать модель (слаг+когда, рабочие
   поля input, грабли). Слаги и версии проверять по API — не выдумывать.

## 7. База знаний — раскладка

```
knowledge/
  INDEX.md      # оглавление: категории моделей, рецепты, api-заметки + дата
  models.md     # лучшие модели по категориям: слаг → что → когда → поля input → ≈цена
  api.md        # рецепты REST: auth, sync, поллинг, схемы, curl/PowerShell, файлы
  playbooks/    # рецепты под задачу: image-to-3d, text-to-image, image-to-video, upscale…
```

## 8. Грабли

- Нет `REPLICATE_API_TOKEN` → все вызовы 401. Проверять первым делом; токен не логировать.
- В `input` идут только https-URL или base64 data-URI, НЕ локальные пути.
- Официальные модели — endpoint `/models/{owner}/{name}/predictions` (без version);
  комьюнити — `/predictions` c `version`. Перепутал путь → 404/422.
- Без `Prefer: wait` ответ приходит со `status:starting` — нужен поллинг, а не «пусто».
- Тяжёлые модели (видео, 3D) не успевают за 60с sync → поднимать `Prefer: wait=300`
  или сразу переходить на поллинг `GET /predictions/{id}`.
- Поля input у моделей разные (`prompt` vs `image` vs `seed` vs `aspect_ratio`) —
  всегда сверять по openapi_schema (§3), а не по памяти.
- Цена посекундная/за-выход — у видео/3D пачкой считать заранее (страница модели).
```
