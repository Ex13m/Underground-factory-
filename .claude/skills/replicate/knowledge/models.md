# models.md — лучшие модели Replicate по категориям

Стартовая карта (актуально на 2026-07). Каталог живой — слаг/версию сверять по API
(`GET /v1/models/{owner}/{name}`) и коллекциям (`/v1/collections/{slug}`). Пополнять §6.

Формат: **owner/name** — что делает — *когда брать* — ключевые поля input.

## Текст→картинка (коллекция `text-to-image`)
- **black-forest-labs/flux-2-pro** — флагман FLUX, фотореализм/качество — *дефолт по картинкам* — `prompt`, `aspect_ratio`, `seed`.
- **black-forest-labs/flux-2-flex** — спец по типографике/тексту на картинке — *постеры, мемы, инфографика, UI-моки* — `prompt`, `aspect_ratio`.
- **black-forest-labs/flux-1.1-pro** — быстрый/дешевле прошлого флагмана — *масс-генерация*.
- **ideogram-ai/ideogram-v3-turbo** — текст/брендинг/дизайн, style-ref (до 3 img) — *логотипы, надписи, ~$0.03/img* — `prompt`, `style_reference_images`.
- **recraft-ai/recraft-v3** — дизайн/векторный стиль, бренд-консистентность — *иллюстрации, иконки*.
- **stability-ai/sdxl** — открытый SDXL — *дёшево, кастом-контроль, LoRA*.

## Редактирование картинки (image→image)
- **black-forest-labs/flux-kontext-pro** — редактирование по референсу+тексту, держит seed — *правки, замена элементов, консистентность* — `prompt`, `input_image`.
- **qwen/qwen-image-edit** — инструктивное редактирование — *локальные правки по тексту*.

## Апскейл / реставрация (коллекции `upscale-images`, `super-resolution`)
- **nightmareai/real-esrgan** — апскейл x2–x4 — *общий апскейл* — `image`, `scale`, `face_enhance`.
- **tencentarc/gfpgan** — реставрация лиц — *старое/размытое фото лица* — `img`, `version`, `scale`.
- **philz1337x/clarity-upscaler** — креативный апскейл с деталями — *арт/портреты* — `image`, `scale_factor`.

## Text/Image→видео (коллекции `text-to-video`, `image-to-video`)
- **kwaivgi/kling-v3** (Kling 3.0) — мультишот, качество — *кинокадры, image→video* — `prompt`, `start_image`, `duration`.
- **google/veo-3.1** (+ `veo-3.1-fast`) — топ-реализм, звук — *премиум-ролики* — `prompt`, `image`.
- **bytedance/seedance-2.0** (Fast/Pro) — идентичность/лицо — *человек в кадре*.
- **wan-video/wan-2.6** (и новее) — видео + аудио, 1080p до ~15с — *со звуком из текста* — `prompt`, `image`.
- **lightricks/ltx-2** — быстрый/дешёвый — *черновики, масс-генерация*.
- **tencent/hunyuan-video** — открытый, длинные сцены — *кастом*.
- **minimax/hailuo-*** — динамика/движение — *экшн-кадры*.

## Image-to-3D / Text-to-3D (коллекция `3d-models`) ⭐ приоритет
- **tencent/hunyuan-3d-3.1** — текст И картинка → текстурированный меш — *лучший старт, высокая детализация текстур* — `image`/`prompt`.
- **fishwowater/trellis2** (TRELLIS 2, 4B) — image→3D, улучшенные PBR-материалы — *продакшн-ассеты, PBR* — `images`, `texture_size`.
- **firtoz/trellis** — image→3D, быстрый и надёжный — *один референс, быстрый результат* — `images`.
- **stability-ai/stable-fast-3d** — 3D менее чем за секунду — *скорость/черновики* — `image`.
- **hi3dgen** — лучший по геометрии — *точная форма*.
- Детали и выбор — рецепт [playbooks/image-to-3d.md](playbooks/image-to-3d.md).

## Аудио / музыка / речь / транскрипция
- **meta/musicgen** — генерация музыки из текста — *фон, джинглы* — `prompt`, `duration`.
- **minimax/speech-02** / **resemble-ai/*** / **jaaari/kokoro** — TTS/озвучка — `text`, `voice`.
- **openai/whisper** / **vaibhavs10/incredibly-fast-whisper** — транскрипция/субтитры — `audio`.

## Удаление фона / сегментация
- **851-labs/background-remover** / **lucataco/remove-bg** — прозрачный фон/cutout — `image`.
- **bria/remove-background** — коммерческий, чистые края.

## Vision / описание / OCR
- Модели чтения картинок (LLaVA/Qwen-VL и т.п.) — коллекция `use-face-detection`/поиск
  `?search=vision`; сверять по каталогу.

## Заметки по цене
- Картинки: ~$0.003–0.05/выход. Видео/3D: посекундно/за-выход — считать по странице модели.
- Официальные модели (`/models/{owner}/{name}`) обычно с прозрачной ценой за выход.
