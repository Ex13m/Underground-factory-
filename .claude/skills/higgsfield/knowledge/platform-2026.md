# Higgsfield — база знаний по платформе (актуально на июль 2026)

Собрано 2026-07-10 из живого каталога Higgsfield MCP (`models_explore`) + официального блога/доков + внешних обзоров.
Id моделей ниже — реальные, из MCP: их можно передавать в `generate_image` / `generate_video` / `generate_audio` / `generate_3d`.

## 1. Платформа в целом (что такое Higgsfield в 2026)

- Позиционирование — «Creative OS»: агрегатор 30+ чужих моделей (Sora 2, Veo 3.1, Kling 3.x, Seedance 2.0, Wan 2.6/2.7, FLUX.2, GPT Image 2…) + свои (Soul 2.0, Cinema Studio, Marketing Studio).
- **MCP-сервер** запущен 30.04.2026, бесплатный для подключения; работает с Claude (web/Cowork/Claude Code) и любым MCP-клиентом. Есть также **CLI** (github.com/higgsfield-ai/cli) — для агентных конвейеров быстрее и дешевле MCP.
- **Официальные скилы**: `npx skills add higgsfield-ai/skills` ставит три штуки:
  - `/higgsfield:generate` — генерация картинок и видео;
  - `/higgsfield:product-photoshoot` — маркетинг-видео из URL продукта;
  - `/higgsfield:soul` — обучение переиспользуемых персонажей (Soul ID) по референс-фото.
- **Supercomputer 2.0** (25.06.2026) — корпоративный маркетинг-агент на NVIDIA Agent Toolkit; добавлены планы Team/Enterprise.
- Плагины для **Adobe Premiere Pro и DaVinci Resolve Studio**; в июле 2026 туда завезли Gemini Omni Flash и Seed Audio 1.0.
- **Higgsfield Earn** — программа монетизации для авторов контента на платформе.
- Компания: осн. 2023, Сан-Франциско, оценка ~$1.3 млрд (нач. 2026).

## 2. Видео-модели (id — из MCP-каталога)

| id | Что это | Ключевое |
|---|---|---|
| `kling3_0` | Kling v3.0 | multi-shot, audio sync, motion transfer; 3–15 с; mode `std`/`pro`/`4k`; `sound on/off` (off дешевле); start_image + end_image; AR 16:9/9:16/1:1 |
| `kling3_0_turbo` | Kling 3.0 Turbo | быстрый и бюджетный t2v/i2v; 3–15 с; 720p/1080p; только start_image (мы им пользуемся в UF) |
| `kling2_6` | Kling 2.6 | кинематографичное движение, физика, нативный звук; 5/10 с |
| `seedance_2_0` | Seedance 2.0 | референс-driven: роли start/end_image + **image/video/audio_references**; 4–15 с; до 4K (mode `std`); `fast` дешевле (до 720p); genre-хинт (action/horror/noir/drama/epic); нативное аудио |
| `seedance_2_0_mini` | Seedance 2.0 Mini | дешёвый вариант, те же референсы, до 720p |
| `seedance1_5` | Seedance 1.5 Pro | надёжное движение; 4/8/12 с |
| `veo3_1` | Google Veo 3.1 | топ-реализм; 4/6/8 с; quality basic/high/ultra; variants preview/fast |
| `veo3_1_lite` | Veo 3.1 Lite | бюджетный батч; аудио опционально (дороже) |
| `veo3` | Veo 3 | veo-3-preview / veo-3-fast |
| `wan2_7` | Wan 2.7 | синхронизированное аудио, консистентный персонаж; audio_references; 2–15 с |
| `wan2_6` | Wan 2.6 | open-weight, стилизация/эксперименты; image/video/audio references |
| `minimax_hailuo` | Minimax Hailuo 2.3 | физика, мимика; варианты 2.3/2.3-fast |
| `grok_video`, `grok_video_v15` | xAI Grok Video / 1.5 | 1.5 — i2v-превью с нативной аудио-режиссурой, 2–15 с |
| `gemini_omni` | Gemini Omni Flash | референс-видео (image/video refs) с нативным аудио; 4–10 с; новинка лета 2026 |
| `cinematic_studio_3_0` | Cinema Studio Video 3.0 | флагман кино-класса: до 4K, жанры, 4–15 с, generate_audio, start/end_image, AR вплоть до 21:9 |
| `cinematic_studio_video_v2` | Cinema Studio v2 | genre, mode pro/std, speedramp (slowmo/speedup/impact), multi_shots, cfg_scale, preset_id |
| `marketing_studio_video` | Marketing Studio | one-click продукт-реклама 12–15 с; пресеты-режимы (UGC, Tutorial, Unboxing, Product Review, Virtual Try On), `hook_id`+`setting_id` ИЛИ `ad_reference_id` (пересоздать сценарий чужой рекламы), аватары + product_ids |
| `clipify` | Personal Clipper | YouTube-URL → до 20 клипов с субтитрами (шрифт/цвет/позиция), face-crop, 9:16/1:1/16:9 |
| `higgsfield_preset` | Preset i2v | вирусные пресет-эффекты image-to-video; id — из `presets_show` |
| `topaz_video`, `bytedance_video_upscale`, `video_upscale` | апскейл видео | Bytedance: до 4K, 24–60 fps, пресеты aigc/ugc/old_film |
| `video_deflicker`, `sam_3_video`, `video_background_remover` | сервисные | дефликер, удаление фона (SAM 3) |

Отдельные инструменты MCP (не модели): `motion_control` (recast/puppeteer/перенос движения по видео-референсу, работает в паре с Kling 2.6/3.0), `reframe` (смена AR видео), `upscale_video/image`, `remove_background`, `outpaint_image`, `dubbing`, `voice_change`, `virality_predictor` (прогноз виральности/hook strength/retention), `video_analysis_*` (анализ чужих видео — обучение), `shorts_studio_*`, `personal_clipper_*`, генерация сайтов и игр.

## 3. Картинки

| id | Что это | Ключевое |
|---|---|---|
| `soul_2` / `soul_v2` | **Higgsfield Soul 2.0** (июль 2026) | «culture-native» фотомодель: UGC-реализм, fashion/editorial, персонажи; quality 1.5k/2k; `soul_id` для персонализации (персонаж из soul_list); 20+ стилей, контроль цвета |
| `soul_cinematic` | Soul Cinema | кино-стиллы и концепт-арт, драматический свет; поддерживает Soul Cinema Character ID (наша основная модель для машин UF) |
| `soul_cast` | Soul Cast | консистентная кино-идентичность персонажа (budget 10–500) |
| `soul_location` | Soul Location | окружения/локации, AR до 21:9 и 9:21 |
| `cinematic_studio_2_5` | Cinema Studio Image 2.5 | кино-стиллы до 4K |
| `nano_banana_2` | Nano Banana 2 (Google) | быстрые качественные картинки 1k/2k/4k, i2i (наша предметка UF) |
| `nano_banana_pro` | Nano Banana Pro | максимум качества, текст и диаграммы, 4K |
| `nano_banana_2_lite` | NB2 Lite | 1k, параметр `thinking` MINIMAL/HIGH |
| `gpt_image_2` | GPT Image 2 (OpenAI) | 1k/2k/4k, quality low/med/high; типографика/редактирование |
| `openai_hazel` | OpenAI Hazel | лучший рендер текста, логотипы/инфографика |
| `seedream_v4_5` | Seedream 4.5 | до ~6K (quality high), точные трансформации |
| `seedream_v5_lite` / `seedream_v5_pro` | Seedream 5.0 | visual reasoning, инструкционное редактирование; pro до 2k |
| `flux_2` | FLUX.2 (BFL) | варианты pro/flex/max, точное следование промпту |
| `flux_kontext` | Flux Kontext | контекстное редактирование, style transfer |
| `kling_omni_image` | Kling O1 Image | фотореализм, широкие AR |
| `grok_image` | Grok Image | экспрессия, высокий контраст; mode std/quality |
| `recraft_v4_1` | Recraft V4.1 | model_type standard/vector/utility/utility_vector — логотипы, иконки, SVG-стиль, продуктовые мокапы; палитра до 10 цветов |
| `z_image` | Z Image | супербыстрый бюджетный стилизованный t2i |
| `image_auto` | Auto | авто-роутинг лучшей модели по промпту |
| `autosprite` | AutoSprite | персонаж-картинка → спрайт-лист для игр (idle/walk/run/attack + изометрия, до 64 кадров) |
| `ms_image` | **DTC Ads** | рекламные картинки с brand kit (лого/цвета/шрифты/тон), аватары, до 4 продуктов, батч до 20; `style_id` ОБЯЗАТЕЛЕН (выбирать из `show_marketing_studio type='image_style'`) |
| `marketing_studio_image` | Marketing Studio Image | one-click продуктовые имидж-ады |
| `outpaint`, `topaz_image(_generative)`, `bytedance_image_upscale`, `image_background_remover` | сервисные | аутпейнт, апскейл (Topaz Redefine/Recovery, лица), 2k/4k |

## 4. Аудио и 3D

**Аудио**
- `seed_audio` — Seed Audio 1.0 (ByteDance): text-to-audio/TTS с voice-референсом (audio_references) или image-референсом; wav/mp3/ogg; speech/pitch/loudness rate.
- `text2speech_v2` — TTS с выбором движка через `variant`: **elevenlabs / minimax / seed_speech / vibe_voice / cozy_voice**; голос preset или свой reference element (`create_voice`).
- `sonilo_music` (музыка), `mirelo_text_to_audio` (SFX), `inworld_text_to_speech` (100+ голосов, есть русские: Svetlana, Elena, Dmitry, Nikolai) — только в игровом конвейере.

**3D** (выход — GLB)
- `sam_3_3d` (Meta SAM 3) — объект с одной картинки в текстурированный меш.
- `image_to_3d` / `multi_image_to_3d` (Meshy) — 1–4 фото → меш; текстуры, PBR, quad/triangle, авто-риггинг гуманоидов, ~680 готовых анимаций (idle=0, walk=30, run=16, jump=466, wave=28, dance=64; поиск — тул `animation_actions`).
- `3d_rigging` — риггинг готового GLB по URL. `tripo_3d` — text-to-3D.

## 5. Промптинг — практические приёмы

**Seedance 2.0** (официальный гайд Higgsfield):
- Структура: в первой строке — число шотов, общая длительность, AR; затем локация/персонажи; затем нумерованные шоты; в конце — тех. сводка.
- 5 рабочих форматов: **Transformations** (эскалация «спокойствие → угроза → трансформация → последствия», лучший перформанс), **Orbs** (один непрерывный POV 15 с, VFX в квадратных скобках `[VFX: ...]`), **POV** (обязательно писать, чего камера НЕ делает: «No cuts, no zoom, natural head movement»), **Fights** (хореография beat-by-beat, дисбаланс сил), **Animation** (тайм-сегменты 0–3s/3–6s, физика частиц явно).
- Реализм: добавить **«no 3D, no cartoon, no VFX»** — выключает пластиковость.
- Кинематографичность: «35mm film quality», «ARRI ALEXA aesthetic», «film grain», «handheld shake», «motion blur on fast actions», «professional color grading», «depth of field».
- Референсы: стартовую картинку обозначать `@image` и ссылаться на неё в тексте; описывать физику (пыль, частицы) так же точно, как действия.
- Слоу-мо контраст: «RAMPS TO SLOW MOTION» … «SNAPS BACK».

**Kling 3.x**:
- **Start & End Frames** — сильнейший приём: даёшь первый и последний кадр, Kling сам строит киношный переход без варпов (смена аутфита/продукта/пропа внутри шота). У `kling3_0` есть оба слота, у `kling3_0_turbo` — только start_image.
- Kling 3.0 умеет multi-shot и motion transfer; звук `off` экономит кредиты.
- Motion Control (Kling 2.6/3.0): движение задаётся видео-референсом, персонаж — картинкой; до 30 с точного повторения движения.

**Cinema Studio**: AI Director разбивает концепт на шоты; per-shot камера (dolly, truck, pan, tilt, crash zoom, 360-орбита, crane, Boltcam); 3.5 — панели Genre/Style/Camera + 4-осевая камера. В API-варианте (`cinematic_studio_video_v2`) — genre, speedramp, multi_shots.

**Soul**: Soul ID = персонаж, обученный по референс-фото (100+ параметров), затем `soul_id` в `soul_2`/`soul_cinematic` держит идентичность между генерациями. Elements — библиотека референс-элементов (лица, продукты, голоса) для переиспользования.

**Комьюнити-формулы** (репо OSideMedia/higgsfield-ai-prompt-skill): MCSLA = Model → Camera → Subject → Look → Action; DISCIPLINE framework — 9 паттернов (конструирование промпта / выбор модели / дисциплина итераций).

## 6. Цены и кредиты (ориентиры, проверять в приложении)

- Планы (годовая оплата): Free — 10 кред/день; Starter ~$9–15 (150–200 кр); Plus ~$17–39 (600–1000); Ultra ~$24–99 (1200–3000); Creator ~$49–119 (6000); Business — от ~$31/место; + Team/Enterprise (с июня 2026).
- Типовые стоимости: Kling 3.0 720p 5с — ~6–7 кредитов; Seedance 2.0 — ~25 кр за 5с (std); Sora 2 / Veo 3.1 — 40–70 кр (премиум всегда за кредиты, даже на unlimited-планах).
- «Unlimited» распространяется только на старые модели (например Soul V1/V2-видео) и троттлится «батареей».
- Докупленные пакеты кредитов **сгорают через 90 дней**, без переноса.
- Дешёвые пути (новинки 2026): `seedance_2_0_mini`, `kling3_0_turbo`, `veo3_1_lite`, `nano_banana_2_lite`, `z_image`, mode `fast` у Seedance, `sound off` у Kling.

## 7. Хроника новинок (конец 2025 — июль 2026)

- Янв 2026 — **Kling 3.0** на платформе (multi-shot, 4K-режим, audio sync).
- Фев 2026 — **Seedance 2.0** и превью **Seedream 5.0**.
- 30.04.2026 — **официальный MCP-сервер** (бесплатный) + CLI + skills-репо `higgsfield-ai/skills`.
- Июнь 2026 — «Creative OS»-апдейт: интеграции с Claude, Adobe, Minecraft; **Supercomputer 2.0** (25.06) + планы Team/Enterprise; Cinema Studio 3.5.
- Июль 2026 — **Soul 2.0** (fashion/UGC, 20+ стилей); **Gemini Omni Flash** и **Seed Audio 1.0** в плагинах Premiere/Resolve; Grok Video 1.5 (превью); гайд-волна про faceless-YouTube с Claude.
- Также за 2026: Wan 2.6/2.7, Veo 3/3.1(+Lite), Minimax Hailuo 2.3, Recraft V4.1, FLUX.2, GPT Image 2, OpenAI Hazel, Kling O1 Image, AutoSprite, SAM 3 (3D и видео-фон), Meshy-3D с риггингом, Personal Clipper, Shorts Studio, DTC Ads с brand kit, Virality Predictor, генерация сайтов и игр, Higgsfield Earn.

## 8. Заметки для наших конвейеров (UF / reel-factory)

- Наш стандарт `kling3_0_turbo` (16:9, 5 с) остаётся лучшим бюджетным i2v; если нужен end-frame или мультишот — брать `kling3_0` (sound off для экономии).
- Для «оживления» карточек товара с консистентностью детали — `seedance_2_0(_mini)` с image_references сильнее, чем чистый start_image.
- Предметка: `nano_banana_2` 4:3, апскейл — `bytedance_image_upscale` до 4k; аутпейнт под другие AR — `outpaint`.
- Кино-стиллы машин — `soul_cinematic`; окружения (гараж, трасса) — `soul_location`; для повторяющегося персонажа-механика — Soul ID.
- Виральные шаблоны i2v — `higgsfield_preset` + `presets_show`.
- Русская озвучка: `text2speech_v2` (variant `elevenlabs`/`minimax`) или `seed_audio` с voice-референсом.

## Источники

- Живой каталог MCP `models_explore` (list: video/image/audio/3d), 2026-07-10 — первоисточник по id/параметрам.
- https://higgsfield.ai/skills , https://higgsfield.ai/mcp , https://higgsfield.ai/cli
- https://higgsfield.ai/blog (посты мая–июля 2026), https://higgsfield.ai/blog/seedance-prompting-guide , https://higgsfield.ai/blog/Kling-Start-End-Frames , https://higgsfield.ai/blog/kling-O1-prompt-bank , https://higgsfield.ai/blog/Kling-2.6-Motion-Control-Full-Guide , https://higgsfield.ai/blog/seedance-2-0-pricing-2026 , https://higgsfield.ai/ai/video/motion , https://higgsfield.ai/nano-banana-intro
- Обзоры цен/фич 2026: https://www.gstory.ai/blog/higgsfield-ai/ , https://aiforesight360.com/higgsfield-ai-review-2026/ , https://aifunnelinsider.com/higgsfield-ai-review-2026/ , https://www.scopeful.org/tools/higgsfield , https://freeaitool.com/en/image-tools/higgsfield-ai-video-generator-complete-guide/
- MCP/агенты: https://claudefa.st/blog/tools/mcp-extensions/higgsfield-mcp , https://www.mindstudio.ai/blog/higgsfield-cli-claude-code-content-automation , https://aiidelist.com/blog/higgsfield-mcp-is-now-free
- Новости июня–июля 2026: https://blog.mean.ceo/higgsfield-news-july-2026/ , https://youmind.com/landing/x-viral-articles/higgsfield-ai-video-creative-os , https://explainx.ai/blog/higgsfield-ai-supercomputer-hermes-agent-2026
- Комьюнити-скил промптинга: https://github.com/OSideMedia/higgsfield-ai-prompt-skill
- YouTube: канал @HiggsfieldAI, плейлист «New Features & Updates» — https://www.youtube.com/playlist?list=PLaQe6ms8V2M7J5szWOlFXfB8fa_J35SMa
