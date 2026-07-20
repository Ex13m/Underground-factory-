# Рецепт: апскейл / реставрация / удаление фона

**Задача:** улучшить качество, увеличить разрешение, восстановить лица, убрать фон.

## Выбор модели
- Общий апскейл x2–x4 → **nightmareai/real-esrgan** (`image`, `scale`, `face_enhance:true`).
- Реставрация лиц (старое/размытое) → **tencentarc/gfpgan** (`img`, `version`, `scale`).
- Креативный апскейл с деталями (арт/портрет) → **philz1337x/clarity-upscaler**
  (`image`, `scale_factor`, `creativity`).
- Прозрачный фон/cutout → **851-labs/background-remover** / **bria/remove-background** (`image`).

## Шаги
```powershell
$h = @{ Authorization = "Bearer $env:REPLICATE_API_TOKEN"; Prefer = "wait" }
$body = @{ input = @{ image = $imgUrl; scale = 4; face_enhance = $true } } | ConvertTo-Json -Depth 8
$r = Invoke-RestMethod -Method Post -Headers $h -ContentType "application/json" `
  -Uri "https://api.replicate.com/v1/predictions" `
  -Body (@{ version = "<real-esrgan latest_version.id>"; input = @{ image=$imgUrl; scale=4 } } | ConvertTo-Json -Depth 8)
$r.output
```
(real-esrgan — комьюнити-модель → через `/predictions` + `version`; версию взять из
`GET /v1/models/nightmareai/real-esrgan`.)

## Цепочки
- txt→image (FLUX) → real-esrgan (апскейл) → background-remover (cutout) → image→3D.

## Грабли
- Поле входа отличается: `image` vs `img` (gfpgan) — сверять схему.
- Слишком большой `scale` на шумном исходнике усиливает артефакты — x2 часто чище.
