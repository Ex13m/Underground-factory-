# api.md — рецепты REST Replicate

База URL: `https://api.replicate.com/v1`. Auth: `Authorization: Bearer $REPLICATE_API_TOKEN`
(старый `Token <t>` тоже работает). Токен НЕ печатать в вывод.

## Схема модели (перед вызовом незнакомой)
```
GET /v1/models/{owner}/{name}
```
→ `latest_version.id` (это `version` для комьюнити-моделей) и
`latest_version.openapi_schema.components.schemas.Input.properties` — поля input.

## Запуск — официальная модель (по имени, без версии)
```powershell
$h = @{ Authorization = "Bearer $env:REPLICATE_API_TOKEN"; Prefer = "wait" }
$body = @{ input = @{ prompt = "a cinematic product shot"; aspect_ratio = "16:9" } } |
  ConvertTo-Json -Depth 8
$r = Invoke-RestMethod -Method Post -Headers $h -ContentType "application/json" `
  -Uri "https://api.replicate.com/v1/models/black-forest-labs/flux-2-pro/predictions" -Body $body
$r.status   # succeeded
$r.output   # URL или массив URL
```

## Запуск — комьюнити-модель (по версии)
```powershell
$body = @{ version = "<latest_version.id>"; input = @{ images = @($url) } } |
  ConvertTo-Json -Depth 8
$r = Invoke-RestMethod -Method Post -Headers $h -ContentType "application/json" `
  -Uri "https://api.replicate.com/v1/predictions" -Body $body
```

## curl (через Bash-инструмент)
```bash
curl -s -X POST \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H 'Content-Type: application/json' -H 'Prefer: wait' \
  -d '{"input":{"prompt":"..."}}' \
  https://api.replicate.com/v1/models/black-forest-labs/flux-2-pro/predictions
```

## Поллинг (если вернулось starting/processing)
```powershell
do { Start-Sleep 3
     $r = Invoke-RestMethod -Headers $h -Uri "https://api.replicate.com/v1/predictions/$($r.id)"
} while ($r.status -in 'starting','processing')
```
`Prefer: wait` держит соединение до 60с; тяжёлые (видео/3D) → `Prefer = "wait=300"`
или сразу поллинг. Отмена: `POST /v1/predictions/{id}/cancel`.

## Локальный файл → data-URI (input не берёт локальные пути)
```powershell
$p = "C:\path\img.png"
$uri = "data:image/png;base64," + [Convert]::ToBase64String([IO.File]::ReadAllBytes($p))
# $uri класть в input.image / input.images[]
```

## Скачать результат в проект
```powershell
Invoke-WebRequest $r.output -OutFile "out.png"           # один URL
$r.output | % { $i=0 } { Invoke-WebRequest $_ -OutFile "out_$($i++).png" }  # массив
```

## Поиск/коллекции
- `GET /v1/collections` — список тем; `GET /v1/collections/{slug}` — модели темы
  (`text-to-image`, `image-to-video`, `text-to-video`, `3d-models`, `upscale-images`,
  `super-resolution`, `text-to-speech`, `audio-generation`).
- `GET /v1/models?search=<q>` — поиск по каталогу.

## Частые статусы/ошибки
- 401 — нет/битый токен. 402 — не включена оплата. 404 — неверный путь/слаг.
- 422 — неверные поля input (сверить openapi_schema). `error` в prediction — читать текст.
