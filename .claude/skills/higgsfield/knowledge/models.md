# models.md — живая карта моделей Higgsfield

Стартовая карта (из инструкций MCP-сервера). Каталог живой — при сомнении сверять
`models_explore(action:'list'|'search'|'get'|'recommend')`. Пополнять из уроков (§4).

Обозначения: **id** — что делает — *когда брать* — ключевые параметры.

## Изображение (`generate_image`, output image)
- **marketing_studio_image** — товарные/рекламные кадры — *реклама, продукт, ЛендингШот*.
- **soul_cast** — персонаж/аватар из текста — *character/avatar без ref, text-only*.
- **soul_2** (Soul V2, `text2image_soul_v2`) — портрет/фэшн/UGC/editorial — *топ по людям;
  единственный (с soul_cinema_studio), кто принимает обученный `soul_id`* — soul_id, aspect_ratio.
- **nano_banana_pro** — 4K, текст на картинке, диаграммы, одноразовый ref-персонаж.
- **soul_cinema_studio** / **soul_cinematic** — Soul Cinema — *кинематографичный кадр/стилл
  персонажа по Soul-личности; реф-листы для роликов (нейтр.-серый фон)*.
- **gpt_image_2** — product-sheets, правки, схемы/карты, брендовая товарная съёмка —
  *ассеты для рекламы, e-commerce карточки*.
- **Cinematic Locations** — фотореалистичные establish-кадры локаций (3/4 ракурсы → глубина).
- (в каталоге также seedream 4.5/5 lite, cinema studio image 2.5/3.0/3.5 — сверять explore)

## Видео (`generate_video`, output video)
- **marketing_studio_video** — реклама/товар — *DTC Ads видео*.
- **clipify** — YouTube→короткие клипы (Personal Clipper).
- **seedance_2_0** — сохранение идентичности/лица в кадре — *человек в кадре, кинореклама
  4K/8K*; 16:9, 24fps; Elements подцепляются по одинаковым именам; аудио-ref через `medias role audio`.
- **draw_to_video** — анимация из наброска/рисунка → видео.
- **kling3_0** — мультишот, звук, motion transfer — *сложные сцены*.
- **kling3_0_turbo** — быстрый text→video / анимация одного стартового кадра — ~7.5 кр/клип; aspect_ratio, duration, `medias role start_image/end_image`.
- **higgsfield_preset** — генерация по пресету — *UGC, Tutorial, Unboxing, Product Review, Try-On* — `preset_id` из `presets_show`; hooks/settings для этих пресетов.

## Аудио (`generate_audio`, только речь/TTS)
- **text2speech_v2_elevenlabs / _minimax / _seed_speech / _vibe_voice / _cozy_voice** —
  TTS — `voice_type`('preset'|'element') + `voice_id` (см. `list_voices`).
- ⚠️ sonilo_music / mirelo_text_to_audio / inworld_text_to_speech — ТОЛЬКО пайплайн игр,
  для standalone музыки/SFX/озвучки НЕ использовать.

## 3D (`generate_3d`, output 3d)
- **image_to_3d** — картинка→GLB, опц. текстура/PBR/риггинг — *общий случай*.
- **multi_image_to_3d** — 2–4 ракурса одного объекта — *точнее геометрия*.
- **sam_3_3d** — один объект из снимка — принимает `prompt` для выбора объекта.
- **3d_rigging** — риггинг готовой модели — вход `model_url` (job_id или GLB-URL);
  анимация: `animation_actions` → `animation_action_id` + `enable_animation:true`.

## Редактирование ассетов (отдельные инструменты, НЕ перегенерация)
- **upscale_image / upscale_video** — до 2K/4K.
- **outpaint_image** — расширить/раскадрировать.
- **reframe** — сменить aspect у видео.
- **remove_background** — вырезать/прозрачный фон.
- **motion_control** — Kling 3.0 Motion Control: image_id + motion_video_id, resolution 720p/1080p, scene_control image|video.

## Идентичность
- **Soul** (`show_characters`) — обученная переиспользуемая личность, 5–20 фото, ~10 мин,
  ОДИН soul_id на генерацию, только soul_2 / soul_cinema_studio.
- **Elements** (`show_reference_elements`) — мгновенно, 1 снимок, НЕСКОЛЬКО субъектов,
  работает с Nano Banana Pro/2, GPT Image 2, Seedream 4.5/5 lite, Cinema Studio, Seedance 2.0, Kling 3.0.

## Стоимость
- Preflight любой генерации: `get_cost:true` (вернёт кредиты без запуска).
- Общий баланс/планы: `balance`, `show_plans_and_credits`, `transactions`.
