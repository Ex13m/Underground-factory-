# Рецепт: текст → картинка

**Задача:** сгенерировать изображение по описанию (или отредактировать по референсу).

## Выбор модели
- Фотореализм/качество по умолчанию → **black-forest-labs/flux-2-pro**.
- Текст на картинке (постер, мем, инфографика, UI) → **black-forest-labs/flux-2-flex**.
- Логотип/брендинг/точный текст, style-ref → **ideogram-ai/ideogram-v3-turbo** (~$0.03).
- Дизайн/вектор/иконки → **recraft-ai/recraft-v3**.
- Дёшево/кастом/LoRA → **stability-ai/sdxl**.
- Правка существующей картинки по тексту+референсу → **black-forest-labs/flux-kontext-pro**
  (поле `input_image`).

## Шаги
1. Выбрать модель (выше). Незнакомую — сверить поля: `GET /v1/models/{owner}/{name}`.
2. Запуск (официальная, синхронно):
```powershell
$h = @{ Authorization = "Bearer $env:REPLICATE_API_TOKEN"; Prefer = "wait" }
$body = @{ input = @{ prompt = "<описание>"; aspect_ratio = "1:1" } } | ConvertTo-Json -Depth 8
$r = Invoke-RestMethod -Method Post -Headers $h -ContentType "application/json" `
  -Uri "https://api.replicate.com/v1/models/black-forest-labs/flux-2-pro/predictions" -Body $body
$r.output   # URL картинки
```
3. Несколько вариантов — повторить с разным `seed` (или `count`, если модель поддерживает).
4. Скачать: `Invoke-WebRequest $r.output -OutFile out.png`.

## Доводка (цепочки)
- Апскейл → `nightmareai/real-esrgan` (`image = $r.output`, `scale = 4`).
- Лица → `tencentarc/gfpgan`. Прозрачный фон → `851-labs/background-remover`.
- Картинку в 3D → см. [image-to-3d.md](image-to-3d.md). В видео → [image-to-video.md](image-to-video.md).

## Грабли
- `aspect_ratio` vs `width/height` — зависит от модели, сверять по схеме.
- Текст на картинке у FLUX-2-pro хуже, чем у flux-2-flex/ideogram — брать спеца.
