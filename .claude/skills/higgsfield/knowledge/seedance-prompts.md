# Библиотека промптов Seedance 2.0 / 4K (Higgsfield)

Источник: higgsfield.ai/blog/Seedance-4k, разбор 2026-07-20. Промпты для Seedance — на
английском, дословно. Общие настройки: **16:9, 15 с, вывод 10-bit color, цель 4K/8K**.
Ниже: (A) универсальный каркас, (B) система референсов и локов, (C) готовые style-префиксы
по жанрам (verbatim), (D) как собрать промпт под задачу.

## A. Универсальный каркас промпта (структурные секции)
Seedance ест промпт из именованных секций — писать их заглавными как заголовки:
```
STYLE: <эстетика, разрешение, грейд, грейн, оптика>
LIGHTING: <схема света, источники, тени>
COLOR: <палитра; часто ratio 60:30:10>
CAMERA: <тип камеры/движение, FOV, мм, motion blur>
MATERIAL: <текстуры кожи/поверхностей>
ACTING: <режиссура игры, эмоции, микродвижения>
PHYSICS: <гравитация, ткань, вода, инерция>
CHARACTER DESIGN: <@имя = точная спека персонажа>
SCENE CONTEXT: <локация, время, погода>
OPTICS: <объектив, боке, блики>
ACTION: <по таймкодам 0:00–0:05 … побитово>
CONTINUITY: <что не меняется между кадрами>
POSITIVE LOCKS: <жёсткие «замки»: что обязано сохраниться>
AUDIO: <диегетический звук/SFX; часто «No music»>
TECHNICAL: <8K, 10-bit, fps>
FORMAT MODE: <oner | multi-cut montage>
```
Не все секции обязательны — минимум STYLE + CAMERA + ACTION + LOCKS. Для одного кадра
без склеек — режим **oner**; для монтажа — **multi-shot montage** с разбивкой по Shot 1/2/3.

## B. Референсы и локи (ключевая механика)
- Референс в промпте — через `@имя`: `@image_1`…`@image_4`, `@video_1`, `@Supercomputer-Heroine`.
  Имя должно СОВПАДАТЬ с именем ассета в панели Elements — тогда подхватится автоматически.
- Жёсткое сохранение исходника (VFX по реальному видео):
  `INPUT LOCK — <<<video_1>>> matches input 100%`
  `@video_1: <что именно сохранить> — preserve exactly` (subject, face, pose, camera, motion).
- `POSITIVE LOCKS:` — список того, что не должно «уплыть» (продукт на месте, цвет, лого).
- Стиль-референс ≠ ключевой кадр: явно писать `image1 is style reference not a keyframe`.

## C. Готовые style-префиксы по жанрам (verbatim — копировать и дополнять)

**Кино, один непрерывный кадр (oner):**
```
single continuous shot, one take no cuts, cinematic oner, cinematic lighting,
photorealistic, 8K ultra-high-definition, hyperdetailed, 35mm film quality,
professional color grading, sharp focus, high detail texture, film grain,
depth of field mastery, steadicam fluidity
```

**Блокбастер/кайдзю (многосценовый, структурный):**
```
STYLE: 8K photorealistic, anamorphic widescreen, original sea-kaiju blockbuster grade,
fine grain, hyperdetailed.
```
(далее секции LIGHTING / COLOR / CAMERA / MATERIAL / ACTING / PHYSICS / CHARACTER DESIGN /
CONTINUITY / TECHNICAL / AUDIO / SCENE CONTEXT / FORMAT MODE / OPTICS / ACTION / POSITIVE LOCKS)

**VFX поверх реального видео:**
```
Style: 8K cinematic, photorealistic — no 3D render, no game engine
INPUT LOCK — <<<video_1>>> matches input 100%
@video_1: <same subject/face/pose/office, camera and motion> — preserve exactly
```

**3D-анимация (Pixar-подобная, монтаж):**
```
montage, multi-shot 3D animated feature film, don't use one camera angle or single cut,
vibrant glossy CGI render, Pixar-quality stylized animation
```
Разбивка: `Shot 1: Medium shot with a playful push-in, <персонаж> <действие>…` и т.д.

**Фэнтези-анимация (живописный матт-пейнт):**
```
Lush cinematic fantasy, hyperreal yet painterly — like a living classic matte-painting
brought to motion: rich, luminous, deeply SATURATED color, crisp detail,
soft volumetric light, fine film grain, anamorphic widescreen
```
Секции: THE WORLD / THE COLOR / THE GIRL / THE CREATURE / KEY LOCKS / SHOTS.

**FPV от первого лица:**
```
Cinematography: First-person POV, naturalistic unconstrained human vision.
Authentic head movement with organic micro-tremor, subtle wind-shake,
reactive eye-line tracking.
```
+ Color ratio `60:30:10`, объектив `24mm`, ACTION по таймкодам, Constraints, Audio.

**FPV-oner с макро (карнавал/whimsical):**
```
single continuous shot, one take no cuts, cinematic FPV oner, 4K ultra-detailed,
photorealistic macro detail, anamorphic film look, epic cinematic scale,
playful whimsical tone
```

**Реклама, люксовая (editorial):**
```
Style: 8K photorealistic editorial luxury skincare commercial, cinematic and moody,
deep black crush, per-character colour worlds.
```
Секции: SCENE CONTEXT / ACTIVE REFERENCES (`@image_1`…`@image_4`) / FORMAT MODE /
8 таймированных секций / CHARACTER·PRODUCT·LOCATION / AUDIO / POSITIVE LOCKS.

**Реклама, hypermotion CGI:**
```
hypermotion, CGI commercial video of our products, about 15sec, 10 scenes / cuts
with 3D CGI showing the product. @Supercomputer-Heroine
```

**Игры, AAA-катсцена (Unreal 5 + HUD):**
```
Style: AAA video-game cinematic — Unreal Engine 5 real-time in-engine render,
open-world cutscene aesthetic with LIVE GAMEPLAY HUD. Match @image_1 as the master
visual + UI reference 100%.
```
+ рендер-спеки (Lumen GI, Nanite), HUD LAYER (позиции/цвета элементов, напр. `chartreuse #d1ef17`),
SUBJECT/LOCATION, SHOT-разбивка по таймкодам, CONSTRAINTS.

**Игры, аркадные гонки:**
```
Style: AAA arcade racing-game gameplay footage — Forza Horizon / Need for Speed look.
Hyper-saturated, glossy, high-contrast real-time render with crisp pinned UI.
```
+ `image1 is style reference not a keyframe`, стойкий HUD, физика «arcade-racing feel», AUDIO (двигатель/boost).

**Игры, босс-файт с HUD (oner):**
```
single continuous shot, one take no cuts, cinematic oner, third-person video-game camera
with persistent in-game HUD, photorealistic, 35mm film quality
```
+ окружение, спека персонажа, список HUD-элементов, непрерывная хореография камеры
(macro/orbit переходы), speed-ramp в слоу-мо.

## D. Как собрать промпт под задачу
1. Взять style-префикс нужного жанра (раздел C) — это первая строка/секция STYLE.
2. Добавить референсы: `@image_1…` для персонажей/продукта/локаций (имена = имена в Elements),
   для VFX по видео — `INPUT LOCK <<<video_1>>>` + «preserve exactly».
3. Прописать ACTION по таймкодам (`0:00–0:05 …`), побитово: движение, камера, реплики/SFX.
4. Закрыть POSITIVE LOCKS (что обязано сохраниться: продукт, лицо, цвет, лого, HUD).
5. AUDIO: диегетический звук/SFX; музыку не вшивать («No music») — накладывать отдельно.
6. Настройки генерации: 16:9, duration 15, resolution по максимуму (4K/8K target, 10-bit).

## Грабли
- Референс не подцепится, если имя `@image_1` в промпте ≠ имени ассета в Elements.
- Без POSITIVE LOCKS/CONTINUITY продукт/лицо «плывут» между кадрами.
- Стиль-референс без пометки `style reference not a keyframe` Seedance примет за кадр.
- Музыка в промпте ломает диегетический звук — «No music», музыка на монтаже (`/reel-factory`).
- Слишком много секций для простого кадра — брать минимум (STYLE+CAMERA+ACTION+LOCKS).
