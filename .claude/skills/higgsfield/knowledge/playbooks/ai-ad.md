# Рецепт: ультра-реалистичная AI-реклама товара

**Задача:** из ссылки на товар / фото продукта сделать рекламный ролик или кадр.

**Вход:** URL товара (магазин/лендинг) ИЛИ загруженное фото продукта.

**Модель:** `marketing_studio_video` (видео) / `marketing_studio_image` (кадр).
В ответах Marketing Studio называть «DTC Ads».

**Шаги (MCP):**
1. По URL: `show_marketing_studio(action:'fetch', url:…)` — сервер сам определит
   product vs webproduct (SKU-страница → product; App Store/лендинг сервиса → webproduct).
   Виджет опрашивает статус сам, ждать не нужно.
2. По загруженному фото: `media_upload_widget` → `show_marketing_studio(action:'create',
   type:'product', medias:[…])`, взять `next_step`.
3. Пресеты: `show_marketing_studio(action:'presets')` (или `type:'hook'`/`'setting'`
   для UGC/Tutorial/Unboxing/Product Review/Try-On) → выбрать hook + setting.
4. Опц. паспорт бренда: `show_marketing_studio(action:'fetch', type:'brand_kit',
   scrap_url:…)` → единый тон/цвета/лого во всех кадрах.
5. Генерация видео: `generate_video(model:'marketing_studio_video', …)` по `next_step`;
   preflight `get_cost:true`.
6. Опрос `job_status sync:true` → `job_display`. Доводка: `upscale_video`, `reframe`
   (под 9:16 / 1:1 / 16:9).

**Проверка:** товар в кадре без искажений; текст читается; хук в первые секунды.
Опц. `virality_predictor(action:'create')` — прогноз удержания/хука.

**Стоимость:** сверять `get_cost:true` перед запуском (зависит от модели/длительности).

**Связь:** этот рецепт — про саму платформу. Если нужен ручной ffmpeg-монтаж, титры,
глитчи, музыка — это `/reel-factory`.
