# Рецепт: image-to-3D (картинка → 3D-модель) ⭐

**Задача:** из фото/картинки объекта сделать 3D-меш (GLB/OBJ), опц. с PBR-текстурами.
Также text-to-3D (по тексту без картинки).

## Выбор модели
- **tencent/hunyuan-3d-3.1** — лучший старт: принимает и картинку, и текст, отдаёт
  текстурированный меш высокой детализации. *Дефолт для большинства задач.*
- **fishwowater/trellis2** (TRELLIS 2, 4B) — продакшн-ассеты с качественными PBR —
  *когда нужны материалы для движка/рендера.*
- **firtoz/trellis** — быстрый и надёжный из одного референса — *черновик/скорость.*
- **stability-ai/stable-fast-3d** — 3D менее чем за секунду — *мгновенный превью.*
- **hi3dgen** — лучшая геометрия — *когда важна точная форма, текстура вторична.*
- text-to-3D без картинки → hunyuan-3d-3.1 с `prompt` (или сперва сделать картинку
  через FLUX, затем image→3D — часто чище результат).

## Шаги
1. Вход: публичный https-URL картинки ИЛИ локальный файл → base64 data-URI (см. api.md).
   Лучший результат: объект по центру, чистый/ровный фон (при нужде сперва
   `851-labs/background-remover`).
2. Схему полей сверить: `GET /v1/models/tencent/hunyuan-3d-3.1` → `openapi_schema`
   (поля вроде `image`, `prompt`, `texture`, `seed` отличаются у моделей).
3. Запуск (официальная модель, тяжёлая — большой таймаут):
```powershell
$h = @{ Authorization = "Bearer $env:REPLICATE_API_TOKEN"; Prefer = "wait=300" }
$body = @{ input = @{ image = $imgUrlOrDataUri } } | ConvertTo-Json -Depth 8
$r = Invoke-RestMethod -Method Post -Headers $h -ContentType "application/json" `
  -Uri "https://api.replicate.com/v1/models/tencent/hunyuan-3d-3.1/predictions" -Body $body
```
   Если `status` не `succeeded` — поллить `GET /v1/predictions/{id}` (3D идёт десятки секунд–минуты).
4. Результат — URL меша (`.glb`/`.obj`, иногда + превью). Скачать:
   `Invoke-WebRequest $r.output -OutFile model.glb` (если output — объект/массив,
   взять поле меша).
5. Несколько ракурсов одного объекта → у trellis2/trellis подать `images: [url1,url2,…]`
   (точнее геометрия).

## Проверка
- Меш без дыр, текстура/PBR на месте, масштаб адекватный. Открыть GLB в любом вьюере.
- Меш повторяет только то, что на картинке — добавить/сменить детали → сперва
  отредактировать картинку (FLUX Kontext), потом конвертировать.

## Цена
- 3D-модели тяжёлые — считать по странице модели; `stable-fast-3d` дешевле всех.
