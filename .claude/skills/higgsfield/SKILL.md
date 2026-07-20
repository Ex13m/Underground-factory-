---
name: higgsfield
description: "Шлюз ко ВСЕМУ потенциалу Higgsfield плюс самообучение на видео. Не только рилсы: картинки (Soul/Nano Banana/Marketing), видео (Kling/Seedance/Marketing Studio), аудио (TTS), 3D (image-to-3D, риггинг), motion control, аватары/Soul-персонажи, reference elements, апскейл, outpaint, reframe, remove-bg, дубляж, voice change, Personal Clipper (YouTube→клипы), Marketing Studio / DTC Ads, brand kit, Virality Predictor, игры, агенты. Умеет учиться: анализирует видео с канала Higgsfield (video_analysis / Personal Clipper / WebFetch), извлекает модели-промпты-приёмы и дописывает их в свою базу знаний knowledge/. Триггеры: /higgsfield, «сгенерируй/сделай в хигсфилде», «картинка/видео/аватар/3D/озвучка/реклама через higgsfield», «выучи это видео higgsfield», «обнови базу higgsfield»."
---

# HIGGSFIELD MASTER — весь арсенал + самообучение

Единый вход ко всему, что умеет Higgsfield, в ЛЮБОМ проекте. Плюс механизм
самообучения: чем больше уроков с канала Higgsfield скил разбирает, тем точнее
подбирает модель, промпт и настройки. Знания живут в `knowledge/` рядом с этим файлом
и накапливаются между сессиями — это не рилс-фабрика (для монтажного видео есть
отдельный `/reel-factory`), а мастер по самой платформе Higgsfield.

Это ещё и **знаток скилов Higgsfield**: скил знает про фирменные скилы/воркфлоу
Higgsfield (генерация, soul-id, товарная съёмка, карточки маркетплейса, сайты,
explainer, раскадровщик Seedance…), берёт лучшие с сайта и САМ определяет, каким
скилом/моделью/воркфлоу задачу закрыть лучше. Любая видео-задача (генерация,
оживление кадра, motion control, дубляж, reframe, апскейл, YouTube→клипы, кинореклама) —
сюда; чисто монтажную сборку с титрами/музыкой отдавать `/reel-factory`.

## 0. С чего начать КАЖДЫЙ раз

1. Прочитать `knowledge/INDEX.md` — что уже усвоено (модели, рецепты, уроки, скилы).
2. Прочитать `knowledge/models.md` — актуальная карта моделей и «когда что».
3. Прочитать `knowledge/higgsfield-skills.md` — есть ли фирменный скил/воркфлоу под задачу.
4. Если под задачу есть готовый рецепт в `knowledge/playbooks/` — идти по нему.
5. Если сомневаешься, какая модель нужна — `models_explore(action:'recommend', query, input)`
   ПЕРЕД вызовом любого `generate_*`; по воркфлоу — `higgsfield workflow list`. Каталог
   живой, имена моделей/воркфлоу НЕ выдумывать.
6. Проверить баланс кредитов при крупной пачке: `mcp__higgsfield__balance` /
   `show_plans_and_credits`; у дорогих генераций сперва `get_cost:true` (preflight).

## 1. Карта арсенала — что каким инструментом (не только видео!)

**Изображения** — `generate_image`:
- товар/реклама/ЛендингШот → `marketing_studio_image`;
- персонаж/аватар из текста → `soul_cast`; портрет/фэшн/UGC/editorial → `soul_2`;
- переиспользуемая личность (Soul, 5–20 фото, ~10 мин) → обучить через
  `show_characters(action:'train')`, потом `soul_2` + `soul_id`;
- 4K / текст на картинке / диаграммы → `nano_banana_pro`;
- одноразовый ref-персонаж → `soul_2` или `nano_banana_pro`.

**Видео** — `generate_video`:
- реклама/товар → `marketing_studio_video`;
- YouTube→короткие клипы → `clipify` / Personal Clipper;
- идентичность/лицо в кадре → `seedance_2_0`;
- мультишот / звук / motion transfer → `kling3_0`;
- быстрый текст→видео или анимация одного кадра → `kling3_0_turbo`;
- пресеты (UGC, Tutorial, Unboxing, Product Review, Try-On) → `higgsfield_preset` +
  `preset_id` из `presets_show`.

**Аудио** — `generate_audio` (только речь/TTS): `text2speech_v2_elevenlabs`,
`…_minimax`, `…_seed_speech`, `…_vibe_voice`, `…_cozy_voice`. Голос: `voice_type`
('preset'|'element') + `voice_id`. Музыку/SFX standalone НЕ генерит (эти модели —
только для пайплайна игр). Голоса смотреть `list_voices`.

**3D** — `generate_3d`: `image_to_3d` (общий, с текстурой/PBR/риггингом),
`multi_image_to_3d` (2–4 ракурса, точнее геометрия), `sam_3_3d` (один объект),
`3d_rigging` (риггинг готовой модели; берёт `model_url` = job_id или GLB-URL).
Анимация: `animation_actions` → `animation_action_id` + `enable_animation:true`.

**Спец-редактирование готовых ассетов** (не перегенерировать!):
- `upscale_image` / `upscale_video` — качество/2K/4K;
- `outpaint_image` — расширить/раскадрировать;
- `reframe` — сменить соотношение сторон у видео;
- `remove_background` — вырезать объект/прозрачный фон;
- `motion_control` — recast/puppeteer/motion transfer (image_id + motion_video_id).

**Персонажи/идентичность**: `show_characters` (Soul, переиспользуемая личность, один
soul_id на генерацию), `show_reference_elements` (Elements — мгновенно, один снимок,
можно НЕСКОЛЬКО субъектов в кадре, работает с Nano Banana/Seedream/Kling/Seedance).
Правило выбора: 1 человек + верность лицу + «цифровой двойник» → Soul; несколько
субъектов / не-человек / мгновенно → Elements.

**Маркетинг**: `show_marketing_studio` (в ответах называть «DTC Ads») — product /
webproduct / avatar / brand_kit, пресеты, fetch по URL. Brand kit — паспорт бренда.

**Аналитика/утилиты**: `virality_predictor` (прогноз виральности/удержания/хука),
`personal_clipper_create` (YouTube→клипы, до 30+ мин), `dubbing` (дубляж),
`voice_change`, `reveal_generation`, `show_generations`/`show_medias` (история),
`list_workspaces`/`select_workspace`.

**Игры**: перед любой генерацией/правкой браузерной игры —
`get_game_creation_instructions`, затем `get_game_creation_bundle_file` за
референсами; `deploy_game` / `publish_game`.

**Агенты**: `sync_agents` — импортировать пользовательские скилы и «личность» текущего
LLM в Higgsfield (marketplace). Запуск строго по явной просьбе `/sync-agents`.

## 2. Медиа-вход (железное правило)

- Локальный файл у пользователя (Apps UI) → `media_upload_widget`. НЕ просить
  прикрепить в чат — remote-инструменты не читают вложения чата.
- Веб-URL картинки/видео → сперва `media_import_url`, затем передавать вернувшийся
  `media_id`. В `medias[].value` кладём media_id/job_id, **никогда не сырой URL**.
- Байты в code-sandbox → `media_upload` → PUT в `upload_url` → `media_confirm`.
- job_id прошлой генерации можно сразу подавать как вход в следующую (цепочки:
  image → video → upscale → reframe).

## 3. Запуск и опрос генерации

- Почти все `generate_*`/edit возвращают job. Опрос: `job_status` (можно `sync:true`),
  показ — `job_display` / `reveal_generation`.
- Если сервер вернул `recovery_tool` — вызвать его немедленно, без вопросов.
- Если пришёл preset-notice, а пресет не нужен — повторить с `declined_preset_id`.
- Параметры модели кладём верхним уровнем в `params`; применять `adjustments` из ответа.
- Скачивание результата в проект: `Invoke-WebRequest <result_url> -OutFile …` в scratchpad.

## 4. САМООБУЧЕНИЕ — как скил становится умнее (ядро)

Источник истины — канал **https://www.youtube.com/@HiggsfieldAI** (уроки, релизы,
воркфлоу). Протокол «выучить видео»:

1. **Разбор видео** — два канала данных:
   - `mcp__higgsfield__video_analysis_create(youtube_url:…)` → вернёт `id`;
     поллить `video_analysis_status(video_analyze_id)` каждые 30–60 с до
     `status:'completed'` (3–5 мин; чем длиннее видео, тем менее точен разбор — брать
     короткие уроки/фрагменты). Даёт сцена-за-сценой: что показывают, приёмы, UI.
   - `WebSearch`/`WebFetch` по названию видео и канала → описание, таймкоды, названия
     фич и моделей, ссылки. (Голая страница watch часто отдаёт только футер — искать
     через WebSearch по заголовку.)
2. **Извлечь и разложить по полкам**: какая фича/модель; когда её применять; точные
   промпт-паттерны и «магические» формулировки; настройки (aspect, duration, пресет,
   роли medias); связки (image→video→upscale); типичные ошибки и как их обходят.
3. **Записать в базу** (см. §5): создать `knowledge/lessons/<slug>.md` с конспектом,
   обновить `knowledge/models.md` (если всплыла новая модель/параметр), добавить/
   обновить рецепт в `knowledge/playbooks/`, дописать строку в `knowledge/INDEX.md`.
4. **Дедупликация**: перед записью прочитать INDEX — если урок про то же, дополнять
   существующий файл, а не плодить дубли. Помечать источник (URL, дата) и
   уверенность (наблюдал в разборе / из описания / предположение).
5. «Обучись на канале» без конкретной ссылки → `WebSearch site:youtube.com
   @HiggsfieldAI` за свежими роликами, взять 2–3 ещё не усвоенных (сверив INDEX),
   прогнать протокол по каждому. Не более 2–3 за подход — video_analysis долгий.

Правило качества: в базу идёт только то, что реально повышает результат генерации
(модель+когда, рабочий промпт-шаблон, настройка, грабли). Пересказ «красивого видео»
без применимого приёма — не записывать.

## 5. База знаний — раскладка

```
knowledge/
  INDEX.md            # оглавление: одна строка на модель/рецепт/урок + дата
  models.md           # живая карта моделей: id → что делает → когда → параметры
  playbooks/          # рецепты под задачу: <задача>.md (реклама, аватар, 3D-товар…)
  lessons/            # конспект по каждому усвоенному видео: <slug>.md (+ URL, дата)
```

- Формат урока (`lessons/*.md`): Источник(URL, дата) · Фича · Модели · Промпт-шаблоны ·
  Настройки · Связки · Грабли · Что добавлено в models/playbooks.
- Формат рецепта (`playbooks/*.md`): Задача · Вход · Модель+параметры · Шаги вызовов
  MCP · Проверка результата · Стоимость(≈кредиты).
- После записи — ВСЕГДА обновить `INDEX.md` (одна строка-указатель, как здесь).

## 6. Рабочий цикл генерации в проекте

1. Понять задачу и формат (картинка/видео/3D/аудио/реклама; соотношение; длительность).
2. INDEX/playbooks → готовый рецепт? да → по нему. нет → `models_explore(recommend)`.
3. Собрать входы (§2), при дорогой пачке — `get_cost:true`.
4. Генерация → `job_status sync:true` → `job_display`.
5. При необходимости доводка: upscale/reframe/outpaint/remove_bg/motion_control.
6. Скачать в проект, вписать путь; если проект ведёт реестр ассетов — прописать туда.
7. Если по ходу узнал новый приём/грабли — дописать в базу (§4–5). Скил учится и на
   практике, не только на видео.

## 7. Грабли (пополнять по мере набивания)

- **ГЛАВНОЕ (фейл 2026-07-20, Warhammer-ролик): НЕ делать голый text-to-video на слабой
  модели.** Правильный путь к качеству: (1) референс-стиллы картиночной моделью
  (`gpt_image_2` c `quality:"high"` — дефолт "low"!, или nano_banana_pro/seedream) →
  (2) глазами проверить стиллы (Read) и перегенерить слабые → (3) оживить через
  `seedance_2_0` (полный, не mini) с `medias role start_image` = job_id стилла.
  В i2v-промпте описывать ТОЛЬКО движение и камеру — визуал делает референс
  («reference does the visual work, prompt does the motion»). mini/480p — только черновики.
- Цены Seedance 15с: mini 480p ≈ 15 кр; full 720p ≈ 67.5; full 1080p ≈ 135.
  Дешёвый маршрут к 1080p: full 720p → bytedance upscale (копейки).

- `medias[].value` — только media_id/job_id, НИКОГДА сырой URL (URL → `media_import_url`).
- Локальные файлы через чат remote-инструменты не видят → `media_upload_widget`.
- Одна Soul-личность = один `soul_id` на генерацию; несколько персонажей → Elements.
- Soul работает только с `text2image_soul_v2`/`soul_cinema_studio`; иначе — Elements.
- `generate_audio` не делает музыку/SFX для общих задач — не подменять TTS-моделью.
- Дорогие генерации без preflight `get_cost` = сюрприз по кредитам.
- Страница YouTube watch часто отдаёт только футер → инфу брать через WebSearch/анализ.
- Длинное видео = менее точный `video_analysis` → учиться на коротких уроках/фрагментах.
```
