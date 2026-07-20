# INDEX — база знаний скила replicate

Оглавление. Одна строка на категорию/рецепт/заметку. Обновлять при пополнении (SKILL.md §6).

## Модели и API
- [models-2026.md](models-2026.md) — ⭐ свежая база (2026-07): точные слаги, цены, поля input, практика API, дифф к старой версии. Смотреть В ПЕРВУЮ очередь.
- [models.md](models.md) — лучшие модели по категориям: слаг → что → когда → поля input → ≈цена (частично устарело, см. models-2026.md).
- [api.md](api.md) — REST-рецепты: auth (Bearer), sync `Prefer: wait`, поллинг, схемы, curl/PowerShell, файлы→base64.

## Рецепты (playbooks/)
- [image-to-3d.md](playbooks/image-to-3d.md) — ⭐ картинка/текст → 3D-меш (Hunyuan3D 3.1, TRELLIS 2, Stable Fast 3D).
- [text-to-image.md](playbooks/text-to-image.md) — текст → картинка (FLUX.2, Ideogram v3, Recraft, SDXL, Kontext-edit).
- [image-to-video.md](playbooks/image-to-video.md) — текст/картинка → видео (Kling, Veo, Seedance, Wan, LTX).
- [upscale-restore.md](playbooks/upscale-restore.md) — апскейл/реставрация/удаление фона (Real-ESRGAN, GFPGAN, Clarity, bg-remover).

## Категории коллекций Replicate (для живой сверки)
- text-to-image · image-to-video · text-to-video · 3d-models · upscale-images ·
  super-resolution · text-to-speech · audio-generation
  (`GET /v1/collections/{slug}`; список — `/v1/collections`).
