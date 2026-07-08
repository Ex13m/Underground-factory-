# МЕДИА-ХРАНИЛИЩЕ UNDERGROUND FACTORY

Весь контент сгенерирован нейросетями (Higgsfield: soul_cinematic — тачки,
nano_banana_2 — предметка деталей, kling3_0_turbo — видео). Пути прописаны
в `src/data/seed.ts` и `src/data/materials.ts`.

## Структура

```
media/
  cars/<car-id>/
    photo.jpg      главное фото тачки (каталог, карусель, гараж)
    live.mp4       «оживление» по фото (модалка тачки, image-to-video)
    parts/<product-id>/<материал>/N.jpg
                   фото деталей: деталь лежит у родной тачки,
                   внутри — папка материала (carbon / composite / abs)
  materials/<grade>/process.mp4
                   видео производства (модалки «Три материала»)
  hero/*.mp4       ночные эпизоды: монтаж на главной + сырьё для промороликов
```

## Дерево «тачка → детали» (деталь физически у родной тачки; чужие — по fitment)

- **nissan-silvia-s15** — kit-widebody-s15 (carbon), mirrors-aero (carbon);
  подходят также: splitter-rx7, diffuser-chrome, kit-wet-legend, canards-civic, skirts-r34
- **toyota-supra-a80** — wing-gt-supra (carbon), kit-full-supra (composite);
  также: splitter-rx7, diffuser-chrome, skirts-r34, mirrors-aero
- **mazda-rx7-fd** — splitter-rx7 (composite);
  также: wing-gt-supra, diffuser-chrome, kit-wet-legend, canards-civic, kit-widebody-s15, mirrors-aero
- **toyota-ae86** — kit-wet-legend (carbon), lip-ae86 (abs);
  также: wing-gt-supra, splitter-rx7, canards-civic, mirrors-aero
- **bmw-e36** — diffuser-chrome (carbon), hood-vents-e36 (composite);
  также: wing-gt-supra, splitter-rx7, skirts-r34, mirrors-aero
- **honda-civic-ek9** — canards-civic (composite);
  также: splitter-rx7, diffuser-chrome, skirts-r34, lip-ae86, mirrors-aero
- **nissan-gtr-r34** — skirts-r34 (composite);
  также: kit-widebody-s15, wing-gt-supra, diffuser-chrome, canards-civic, mirrors-aero
- **lada-2107** — wing-lada (abs);
  также: splitter-rx7, lip-ae86, mirrors-aero

## Hero-эпизоды (сырьё для промороликов, 16:9 / 720p / 5 с)

drift, burnout, race, s15-street, s15-dock, supra-hwy, supra-round, rx7-touge,
rx7-flames, ae86-hill, ae86-ramp, e36-dock, ek9-rain, r34-tunnel, r34-apron,
tandem, drag, garage, lada-snow, lada-barrel
