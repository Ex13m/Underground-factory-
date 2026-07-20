# models-2026.md — актуальная база моделей Replicate (июль 2026)

Собрано из replicate.com/explore, коллекций и свежих обзоров (2026-07).
Слаги и цены — живые, перед запуском сверять: `GET /v1/models/{owner}/{name}`.
Цены ≈ ориентир; точная цена — на странице модели.

> ✅ Слаги проверены живым API 2026-07-10 (аккаунт ex13m). Поправлено против 404:
> LTX → `lightricks/ltx-2-pro`/`ltx-2-fast`; Stable Fast 3D на Replicate отсутствует
> (быстрый 3D → `prunaai/hunyuan3d-2` / `firtoz/trellis`). Остальные headline-слаги
> (Kling `kwaivgi/kling-v3-video`, `wan-2.7-t2v`, `runwayml/gen-4.5`, FLUX.2, nano-banana-2,
> seedream-4.5, topaz/upscale, minimax music/speech, whisperx и др.) — резолвятся.

## 1. Генерация картинок (text-to-image)

| Модель | Когда брать | Ключевые поля input | ≈Цена |
|---|---|---|---|
| **black-forest-labs/flux-2-pro** | дефолт: фотореализм + мульти-референс (до 8 img, лимит 9 Мп суммарно), JSON-промптинг | `prompt`, `aspect_ratio`, референс-картинки, `seed` | ~$0.03/Мп |
| **black-forest-labs/flux-2-max** | максимум качества: продуктовая съёмка, консистентность персонажа | как у pro | дороже pro (~25 кред.) |
| **black-forest-labs/flux-2-flex** | типографика: текст на картинке, постеры, макеты | `prompt`, `aspect_ratio` | — |
| **black-forest-labs/flux-2-klein-4b** | реалтайм/черновики, генерация < 1 с | `prompt` | дёшево |
| **google/nano-banana-2** | быстро + редактирование, фьюжн до 14 референсов, точный текст | `prompt`, image-входы (до 14), `aspect_ratio` (`match_input_image`), `output_format` jpg/png | ~$0.08/img |
| **google/nano-banana-pro** | SOTA от Google, генерация+редактирование | как выше | ~$0.15/img |
| **bytedance/seedream-4.5** | кино-эстетика, свет, пропорции; до 4K, батч и мульти-референс | `prompt`, референсы, размер | ~$0.04/img |
| **bytedance/seedream-5-lite** | «умная» генерация со встроенным рассуждением (пространственные связи) | `prompt` | дёшево |
| **openai/gpt-image-1.5** / **gpt-image-2** | сложные промпты, читаемый текст, люди; 1.5 требует свой ключ OpenAI (BYOK) | `prompt`, image-входы | по токенам OpenAI |
| **ideogram-ai/ideogram-v3-turbo** | логотипы/надписи/бренд-дизайн, style-ref | `prompt`, `style_reference_images` | ~$0.03/img |
| **ideogram-ai/ideogram-v3-quality** | то же, но качество (и inpainting) | `prompt`, `mask` | ~$0.09/img |
| **recraft-ai/recraft-v4** | дизайн-подход, сильный текст | `prompt`, `style` | ~$0.04/img |
| **recraft-ai/recraft-v4-svg** | единственный настоящий редактируемый SVG | `prompt` | — |
| **google/imagen-4-ultra** / **imagen-4-fast** | тончайшие детали (ultra) / быстрые итерации (fast) | `prompt`, `aspect_ratio` | — |
| **prunaai/z-image-turbo** | супердёшево и быстро, масс-генерация (6B) | `prompt` | копейки |
| **krea/krea-2-medium** | иллюстрация, аниме, живописные стили | `prompt` | — |
| **black-forest-labs/flux-schnell** | самый дешёвый FLUX | `prompt` | $3/1000 img |

Устаревающие, но живые: `flux-1.1-pro` ($0.04/img), `flux-dev` ($0.025/img), `flux-1.1-pro-ultra` (до 4 Мп, raw-режим), `stability-ai/sdxl` (LoRA/кастом).

## 2. Редактирование картинок (image-editing)

| Модель | Когда брать | Поля input |
|---|---|---|
| **black-forest-labs/flux-kontext-pro** / **flux-kontext-max** | правки по тексту: замена объектов, style transfer; max — лучше типографика. Живы, НЕ вытеснены FLUX.2 | `prompt`, `input_image` |
| **google/nano-banana-2** / **nano-banana** / **nano-banana-pro** | универсальный эдит с мульти-референсами (до 14) | `prompt`, image-входы |
| **bytedance/seedream-4.5** | эдит с пространственным пониманием, мульти-реф | `prompt`, `image` |
| **openai/gpt-image-1.5** | правки людей: держит идентичность лица | `prompt`, `image` |
| **black-forest-labs/flux-fill-pro** | inpaint/outpaint: удалить/заменить объект | `image`, `mask`, `prompt` |
| **black-forest-labs/flux-depth-pro** / **flux-canny-pro** | ретекстур с сохранением 3D / скетч→картинка по контурам | `control_image`, `prompt` |
| **bria/eraser** / **bria/genfill** | чистое удаление объекта / дорисовка (коммерч. лицензия) | `image`, `mask` |
| **qwen/qwen-image-edit** | инструктивные локальные правки, открытая | `image`, `prompt` |
| **prunaai/p-image-edit** | мульти-эдит < 1 с, массово и дёшево | `image(s)`, `prompt` |

Файнтюны: коллекции `flux-fine-tunes`, `flux-kontext-fine-tunes`, `qwen-image-fine-tunes`.

## 3. Видео (text-to-video / image-to-video)

| Модель | Когда брать | Поля input | ≈Цена |
|---|---|---|---|
| **kwaivgi/kling-v3-video** | кино-кадры до 15 с, мультишот (до 6 сцен), звук | `prompt`, `start_image`, `end_image`, `duration` 3–15, `mode` standard(720p)/pro(1080p), `aspect_ratio`, `generate_audio`, `negative_prompt`, `multi_prompt` (JSON-массив сцен) | ~$0.084/с (без аудио), ~$0.168/с (с аудио) |
| **google/veo-3.1** / **veo-3.1-fast** | топ-реализм + нативный звук; референсы для консистентности персонажа | `prompt`, `image`, референсы | fast от ~$0.15/с |
| **bytedance/seedance-2.0** | мультимодальные референсы: до 9 img + 3 видео + 3 аудио, в промпте — [Image1]/[Video1]/[Audio1]; авто-длительность | `prompt`, референсы, `duration` (−1 = авто), `aspect_ratio` (в т.ч. adaptive, 21:9), `resolution` 480p/720p | от ~$0.022/с (standard) |
| **runwayml/gen-4.5** | №1 бенчмарка Artificial Analysis: физика, детали | `prompt`, `image` | — |
| **xai/grok-imagine-video** | короткие клипы со звуком за ~30 с, соцсети | `prompt`, `aspect_ratio` | — |
| **minimax/hailuo-2.3** | динамика/экшн, t2v и i2v, standard/pro | `prompt`, `first_frame_image` | — |
| **wan-video/wan-2.7-t2v** | открытая, 27B MoE; самая дешёвая линейка | `prompt` (i2v-варианты: `image`) | дёшево |
| **alibaba/happyhorse-1.1** | видео из текста, одной картинки или набора референсов, 720p/1080p | `prompt`, `image(s)` | — |
| **pixverse/pixverse-v5.6** | бюджетный вариант, юнит-цены | `prompt`, `image` | дёшево |
| **lightricks/ltx-2-pro** / **ltx-2-fast** | черновики, скорость, open-source, + звук (`generate_audio`) | `image`, `prompt`, `duration`, `resolution` | дёшево |
| **prunaai/p-video** | drafts: превью в 4× быстрее | `prompt` | дёшево |

Ещё: `tencent/hunyuan-video` (открытая, кастом), коллекции `video-editing`, `ai-enhance-videos`, `lipsync`.

## 4. Image-to-3D / Text-to-3D (`3d-models`)

| Модель | Когда брать | Поля input |
|---|---|---|
| **tencent/hunyuan-3d-3.1** | лучший старт: текст И картинка → текстурированный меш | `image` / `prompt`, опции текстуры |
| **fishwowater/trellis2** (TRELLIS 2) | продакшн-ассеты, PBR-материалы | `images`, `texture_size` |
| **hyper3d/rodin** (Rodin Gen-2) | сложные модели из картинок, высокая детализация | `input_image_urls`, `geometry_file_format` |
| **firtoz/trellis** | один референс, быстро и надёжно | `images` |
| **prunaai/hunyuan3d-2** | ускоренный Hunyuan3D-2 | `image` |
| **tencent/hunyuan3d-2mv** | форма по нескольким видам (multi-view) | несколько `image` |
| **prunaai/hunyuan3d-2** / **firtoz/trellis** | быстрый 3D / черновики (Stable Fast 3D на Replicate НЕТ — проверено API) | `image` / `images` |
| **adirik/wonder3d**, **jd7h/zero123plusplus** | картинка → набор ракурсов / грубый ассет | `image` |
| **adirik/text2tex**, **adirik/texture** | текстура для готового меша по тексту | `mesh`, `prompt` |

Цены не публикуются на страницах коллекции — считать по странице модели (обычно $0.02–0.2/запуск).

## 5. Апскейл / реставрация (`super-resolution`, `ai-image-restoration`)

| Модель | Когда брать | Поля input |
|---|---|---|
| **topazlabs/image-upscale** | универсал: 5 режимов (Standard/LowRes/CGI/HighFidelity/TextRefine), до 6×, улучшение лиц | `image`, `enhance_model`, `upscale_factor`, `face_enhancement` |
| **philz1337x/clarity-pro-upscaler** | креативный апскейл до 16×, ползунок creativity | `image`, `scale_factor`, `creativity` |
| **philz1337x/crystal-upscaler** | портреты/лица/предметка, 10× быстрее аналогов | `image`, `scale_factor` |
| **recraft-ai/recraft-crisp-upscale** | чисто и резко без «фантазий», под печать | `image` |
| **recraft-ai/recraft-creative-upscale** | добавить детали AI-арту | `image` |
| **prunaai/p-image-upscale** | до 4 Мп < 1 с (макс. 8 Мп), дёшево | `image` |
| **nightmareai/real-esrgan** | классика x2–x4, дёшево | `image`, `scale`, `face_enhance` |
| **tencentarc/gfpgan** | реставрация лиц на старых/размытых фото | `img`, `version`, `scale` |

## 6. Аудио: музыка / TTS / транскрипция

**Музыка** (`ai-music-generation`):
- **minimax/music-2.5** (на explore уже 2.6) — полные песни с вокалом и текстом — *дефолт по музыке* — `lyrics`, `prompt`.
- **elevenlabs/music** — до 5 мин, студийное качество, composition plan.
- **stability-ai/stable-audio-2.5** — музыка/звуки до 3 мин + audio inpainting — `prompt`, `duration`.
- **google/lyria-2** — 30-с клипы 48 кГц стерео, negative prompt.
- **meta/musicgen** — открытая классика, melody conditioning — `prompt`, `duration`, `input_audio`.
- **lucataco/ace-step** — полная песня с вокалом за ~20 с, дёшево.

**TTS** (`text-to-speech`):
- **minimax/speech-2.8-hd** — №1 бенчмарков, клонирование, 32+ языка — `text`, `voice_id` — *дефолт*.
- **minimax/speech-2.8-turbo** — низкая задержка, клонирование, эмоции.
- **inworld/realtime-tts-2** — самый выразительный, стиринг обычным языком, 100+ языков, клонирование.
- **google/gemini-3.1-flash-tts** — 30 голосов, 70+ языков, быстро.
- **elevenlabs/v3** — выразительность, аудио-теги.
- **resemble-ai/chatterbox** — мгновенное клонирование с короткого сэмпла, открытая.

**Транскрипция** (`speech-to-text`):
- **victor-upmeet/whisperx** — таймстампы по словам + диаризация — *дефолт для субтитров* — `audio_file`.
- **vaibhavs10/incredibly-fast-whisper** — 150 мин аудио за <2 мин, 98 языков — `audio`.
- **openai/gpt-4o-transcribe** / **gpt-4o-mini-transcribe** — лучший WER, акценты/термины.
- **rafaelgalle/whisper-diarization-advanced** — мультиспикерные записи.
- **openai/whisper** — базовый, дёшево.

## 7. Удаление фона (`remove-backgrounds`)

- **851-labs/background-remover** — чистые края за доли цента — *дефолт* — `image`.
- **lucataco/remove-bg** — максимум скорости — `image`.
- **bria/remove-background** — коммерческая лицензия, чистые края.
- **men1scus/birefnet** — сложные контуры (BiRefNet).
- Видео: **arielreplicate/robust_video_matting**, **lucataco/rembg-video** — `input_video`.

## 8. Vision / VLM (описание, OCR, распознавание)

- **google/gemini-3-flash** — быстрый разбор картинок — *дефолт для «что на фото»* — `prompt`, `image`.
- **openai/gpt-5.4** — сложный визуальный анализ, контекст 1M.
- **anthropic/claude-4.5-sonnet** — скриншоты UI, техсхемы, нюансы.
- **openai/gpt-4o-mini** — дёшево, массовая обработка.
- **lucataco/moondream2** — лёгкая открытая, капшены/VQA.
- OCR — коллекция `text-recognition-ocr`; детекция объектов — `ai-detect-objects`.

## 9. Практика API (проверено по докам, 2026-07)

**Официальные vs комьюнити:**
- Официальные (коллекция `official`, стабильный API и цена за выход):
  `POST /v1/models/{owner}/{name}/predictions` — версия НЕ нужна.
- Комьюнити: `POST /v1/predictions` c `{"version": "<id>", "input": {...}}` —
  version id брать из `GET /v1/models/{owner}/{name}` (`latest_version.id`).
- Свои деплойменты: `POST /v1/deployments/{owner}/{name}/predictions`.

**Синхронный режим `Prefer: wait`:**
- Держит соединение до готовности; по умолчанию ждёт **60 с**, настраивается `Prefer: wait=N`.
- Не успело — возвращается незавершённый prediction (дальше поллить). Подходит для
  картинок/аудио; видео и 3D — почти всегда асинхронно.

**Файловые входы (3 способа):**
1. **HTTP URL** — предпочтительно для больших файлов (лимит не указан).
2. **Files API / загрузка клиентом** (Blob/File/Buffer) — до **100 МБ**.
3. **data URI (base64)** — только до **1 МБ** (маленькие картинки/маски).

**Поллинг:**
- В ответе есть `urls.get` — GET его раз в 1–3 с, пока `status` не станет
  терминальным: `succeeded` / `failed` / `canceled` (промежуточные: `starting`, `processing`).
- Продакшн-альтернатива — `webhook` в теле запроса (POST придёт по готовности).
- Выходные файлы у prediction живут ограниченно — скачивать сразу.

## Что изменилось с прошлой версии базы (models.md)

- FLUX.2 разросся: + `flux-2-max` (топ) и `flux-2-klein-4b` (реалтайм).
- Google: `nano-banana-2` / `nano-banana-pro` — теперь топ по эдиту (до 14 референсов).
- Recraft теперь **v4** (+ отдельный `recraft-v4-svg`), Seedream — **4.5** и **5-lite**.
- Видео: слаг Kling — `kwaivgi/kling-v3-video` (не `kling-v3`); + `runwayml/gen-4.5` (№1 бенчмарка),
  `xai/grok-imagine-video`, `alibaba/happyhorse-1.1`, `minimax/hailuo-2.3`, Wan — `wan-2.7-t2v`.
- 3D: + `hyper3d/rodin` (Rodin Gen-2) и `prunaai/hunyuan3d-2`.
- Апскейл: новые лидеры — `topazlabs/image-upscale` и линейка philz1337x/recraft;
  real-esrgan/gfpgan теперь «бюджетная классика».
- Музыка: MiniMax `music-2.5/2.6` вместо MusicGen как дефолт; TTS — `minimax/speech-2.8-*`, `inworld/realtime-tts-2`.
- STT: дефолт — `victor-upmeet/whisperx` (слова+диаризация) и `openai/gpt-4o-transcribe`.

## Источники

- https://replicate.com/explore — featured/trending (2026-07)
- https://replicate.com/collections — полный список коллекций
- Коллекции: text-to-image, image-editing, text-to-video, image-to-video, 3d-models,
  super-resolution, text-to-speech, speech-to-text, ai-music-generation,
  remove-backgrounds, vision-models, flux
- https://replicate.com/pricing — цены официальных моделей
- https://replicate.com/docs/topics/predictions/create-a-prediction — Prefer: wait, поллинг
- https://replicate.com/docs/topics/predictions/input-files — лимиты файловых входов
- https://melies.co/compare/ai-image-models — сравнение картинок 2026 (цены FLUX.2/Seedream/nano-banana)
- https://evolink.ai/blog/best-ai-video-generation-models-2026-pricing-guide и
  https://www.atlascloud.ai/blog/guides/best-ai-video-generation-models-2026 — цены видео за секунду
