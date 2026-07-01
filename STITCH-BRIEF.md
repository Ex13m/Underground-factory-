# 🧵 STITCH BRIEF — UNDERGROUND FACTORY

Готовые промпты для [Google Stitch](https://stitch.withgoogle.com). Как пользоваться:

1. Открой Stitch → New project → режим **Web**.
2. Вставь **GLOBAL STYLE** в первое сообщение (он задаёт стиль всему проекту).
3. Дальше генерируй экраны по одному — вставляй промпт экрана из списка ниже.
4. К первому сообщению приложи референсы: скрины текущего сайта (я прислал в чат) и/или свои Pinterest-рефы — Stitch понимает картинки.
5. Результат: скринь понравившиеся варианты или экспортируй (Figma / HTML) — кидай мне, я переведу сайт на новый дизайн, вся логика (корзина, кабинет, админка, бот, API) сохранится как есть.

> Промпты на английском — Stitch на нём генерит заметно лучше. Русские подписи дублируй по вкусу.

---

## GLOBAL STYLE (вставить первым)

```
Design system for "UNDERGROUND FACTORY" — an underground car tuning shop selling
carbon fiber / composite / ABS body kits (widebody kits, GT wings, splitters,
diffusers) for JDM cars (Nissan Silvia S15, Supra A80, RX-7, Skyline R34).

Style: cyber-industrial techwear, Japanese street racing decals. Dark, aggressive,
premium. Think techwear decal sheets: warning stripes, barcodes, stencil type,
tech-labels like "UF—042 // PROTOTYPE", "PHASE—02", "QC ▸ PASSED", katakana/kanji
accent glyphs (軽量 = lightweight, 速い = fast).

Palette:
- background: near-black asphalt #0A0A09
- surface: #111110, HUD plates with cut corners (chamfered 18px) and rivet dots
- primary / accent: blood red #E01B22 (CTAs, decal tapes, glow on carbon badges)
- paper: dirty white #ECEAE5 (inverse sections, text)
- steel grey #8A8D90 (tech labels), hazard yellow #FFB400 (admin/warning accents)

Typography: Unbounded (900) for stencil-style uppercase display headings,
JetBrains Mono for tech labels / prices / SKUs, Manrope for body text,
Noto Sans JP for kanji accents.

Recurring elements: red decal tape labels, CSS barcodes, diagonal hazard stripes,
zigzag section dividers, film grain, vertical red decal ribbons with kanji,
material grade badges (ABS tan #B9A084, Composite chrome #D9E2E8, Carbon red
#E01B22 with glow). Language: Russian UI with English tech-labels.
```

---

## Экран 1 — HOME

```
Landing page. Fullscreen hero: dark drift-car video background, giant stencil
headline "САМЫЙ ЛЁГКИЙ ОБВЕС НА ПЛАНЕТЕ" with subtle glitch, red tape label
"UNDERGROUND FACTORY // CARBON DIV.", vertical red decal ribbon on the right edge
with kanji. Below hero — THE core block "ТВОЯ ТАЧКА": two selects (car make →
model) + big red CTA "Подобрать обвес" (car-first shopping).
Then: inverse (dirty-white) section with 3 material grade cards (АБС / Композит /
Карбон, carbon glows red); a 4-step production strip PHASE—01..04
(ФОРМА → УКЛАДКА → АВТОКЛАВ → ГОНКА) as HUD plates; a full-width red poster
section with giant kanji 軽量 and slogan "Жёстче, чем сталь. Легче, чем твои
отмазки."; product hits grid; tilted sticker-style customer reviews; animated
counters row. Footer with barcode and hazard stripe.
```

## Экран 2 — CATALOG

```
Catalog page, car-first. Top bar: selected car panel (photo, make/model, red
"TARGET LOCKED" tape) + quick chip "Из гаража: Silvia S15". Filters as decal
chips: material grade (АБС/Композит/Карбон), price range, toggle "только под
мою тачку", sort by weight/price/heat resistance. Counter "НАЙДЕНО: 12 // UNITS".
Product grid: HUD-plate cards with cut corners — photo, name, SKU (UF-KIT/01),
price in mono, weight in grams LARGE, heat badge "ТЕРМО ▸ 200°C", material grade
badge, heart favorite, red "В корзину" button. Hover: plate lifts, red border.
Empty state: "404 KIT NOT FOUND".
```

## Экран 3 — PRODUCT

```
Product page for "Widebody «SILHOUETTE DIV.»" ($3200, carbon). Left: big gallery
image in a HUD frame with tech markings (SKU, coordinates, QC ▸ PASSED), thumbnail
strip. Right: red material tape "КАРБОН", stencil product name, big price, spec
plate: WEIGHT 6400 г (huge mono), ТЕРМО ▸ 200°C, material spec "Карбон 2×2 твил,
автоклав", "CRASH-TEST ▸ TRACK APPROVED". Fitment chips (Nissan Silvia S15,
Skyline R34) + green plate "FITS YOUR CAR ✓". Quantity stepper + big red add to
cart. Small teaser plate from sales bot "ПИТ-БОСС". Below: related kits row.
```

## Экран 4 — CART + CHECKOUT

```
Two screens. CART: line items as HUD plates (photo, name, SKU, qty stepper, price),
fun metric plate "ВЕС ЗАКАЗА: 9 500 г", promo code input with applied state
"КОД CARBON10 ПРИНЯТ // −10%", sticky order summary, red CTA "ОФОРМИТЬ // PHASE—02".
Empty state "404 CART NOT FOUND".
CHECKOUT: Stripe-style payment form themed dark-industrial: email, name on card,
card number with VISA badge, MM/YY, CVC; right column order summary; processing
state as mono console log "CONNECTING TO STRIPE… TOKENIZING CARBON… APPROVED ✓";
success screen "PHASE—02: PRODUCTION" with order number UF-XXXXXX, barcode,
confetti.
```

## Экран 5 — ACCOUNT (личный кабинет)

```
Account page. Profile HUD plate: avatar, name, email, provider badge (Google),
"PILOT ID // UF-1042". Section ГАРАЖ: grid of user's cars, active car highlighted
with red border + "ACTIVE" tape, add-car form (pick from list or manual), each car
has "Подобрать обвес" button. Section ЗАКАЗЫ: order cards with live 4-step status
tracker (Формуем деталь → Запекаем в автоклаве → В пути → Доставлен), progress
line with pulsing current dot. Section ИЗБРАННОЕ: mini product cards.
Sign-in modal "ИДЕНТИФИКАЦИЯ ПИЛОТА" with Google / Apple / GitHub buttons.
```

## Экран 6 — ADMIN

```
Admin page "СЛУЖЕБНОЕ ПОМЕЩЕНИЕ", staff-room vibe: yellow hazard stripe, tape
"STAFF ONLY // 関係者以外立入禁止". Tabs: ОБВЕСЫ / ТАЧКИ / ЗАКАЗЫ / ПРОМО / ОБМЕН.
Products table (SKU, thumb, name, price, weight, material badge, HIT tag,
edit/delete). Add-product form on HUD plate: bilingual name/desc, price, weight,
heat °C, MATERIAL SELECT (карбон / композит / АБС), fitment chips, media URL rows
with live preview. Exchange tab: export/import JSON catalog + integration snippet
window.UF_API.rest('GET','/catalog').
```

---

## Что прислать мне обратно

- Скрины выбранных вариантов (можно прямо фото экрана) **или** экспорт из Stitch (Figma-ссылка / HTML).
- Достаточно 1–2 экранов, если стиль единый — остальное я экстраполирую.
- Я перенесу новый дизайн в код: поменяются `global.css` + стили страниц, логика не тронется.
