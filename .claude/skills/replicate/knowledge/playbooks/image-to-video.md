# Рецепт: текст/картинка → видео

**Задача:** оживить картинку или сгенерировать видео по тексту.

## Выбор модели
- Кино-качество, мультишот, image→video → **kwaivgi/kling-v3** (Kling 3.0).
- Топ-реализм + звук, премиум → **google/veo-3.1** (быстрее/дешевле — `veo-3.1-fast`).
- Человек/идентичность в кадре → **bytedance/seedance-2.0** (Pro/Fast).
- Видео СО звуком из текста, 1080p до ~15с → **wan-video/wan-2.6**.
- Дёшево/черновики масс-генерацией → **lightricks/ltx-2**.
- Открытый/кастом, длинные сцены → **tencent/hunyuan-video**.

## Шаги
1. Сверить поля модели: `GET /v1/models/{owner}/{name}` (`prompt`, `image`/`start_image`,
   `duration`, `aspect_ratio`, `fps` — набор отличается).
2. Запуск (видео тяжёлое — большой таймаут или сразу поллинг):
```powershell
$h = @{ Authorization = "Bearer $env:REPLICATE_API_TOKEN"; Prefer = "wait=300" }
$body = @{ input = @{ prompt = "<сцена>"; start_image = $imgUrl; duration = 5 } } |
  ConvertTo-Json -Depth 8
$r = Invoke-RestMethod -Method Post -Headers $h -ContentType "application/json" `
  -Uri "https://api.replicate.com/v1/models/kwaivgi/kling-v3/predictions" -Body $body
```
   Не `succeeded` → поллить `GET /v1/predictions/{id}` (видео — десятки секунд–минуты).
3. Стартовый кадр лучше сгенерить отдельно (FLUX) и подать в `start_image` — контроль сцены.
4. Скачать: `Invoke-WebRequest $r.output -OutFile out.mp4`.

## Доводка
- Апскейл видео/реформат — отдельные модели (поиск коллекции) или собрать ffmpeg-ролик
  через `/reel-factory`. Звук: `wan-2.6`/`veo` дают со звуком; иначе накладывать отдельно.

## Грабли
- 60с sync не хватает на видео → `Prefer: wait=300` или поллинг.
- Поле старт-кадра называется по-разному (`image` / `start_image` / `first_frame`) — схема.
- Цена посекундная — длинные ролики считать заранее.
