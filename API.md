# UNDERGROUND FACTORY // API

```
 ██╗   ██╗███████╗      █████╗ ██████╗ ██╗
 ██║   ██║██╔════╝     ██╔══██╗██╔══██╗██║
 ██║   ██║█████╗       ███████║██████╔╝██║
 ██║   ██║██╔══╝       ██╔══██║██╔═══╝ ██║
 ╚██████╔╝██║          ██║  ██║██║     ██║
  ╚═════╝ ╚═╝          ╚═╝  ╚═╝╚═╝     ╚═╝
 UNDERGROUND FACTORY — CARBON DIVISION
 STAFF ONLY // 関係者以外立入禁止
```

> Интеграционный контракт магазина тюнинг-обвесов из карбона, композита и АБС.
> Читается за пять минут. Ломается дольше, чем наши сплиттеры.

---

## 1. Архитектура

**Прототип.** Никакого бэкенда нет — и это фича. Весь каталог живёт как
**localStorage-оверлей поверх сид-данных** (`src/data/seed.ts`):

| Слой | Ключ localStorage | Что хранит |
| --- | --- | --- |
| custom-товары | `uf:products:custom` | добавленные через админку/API |
| скрытые товары | `uf:products:hidden` | «удалённые» сид-позиции (сид не мутируется) |
| правки сида | `uf:products:overrides` | патчи поверх сид-товаров |
| custom-тачки | `uf:cars:custom` | добавленные модели |
| заказы | `uf:orders` | журнал заказов |
| промокоды | `uf:promos` | коды от бота и админа |
| паспорта материалов | `uf:materials` | правки историй/спек/видео (Админка → МАТЕРИАЛЫ) |
| очередь генерации | `uf:genqueue` | заявки «Заказать ▸ Higgsfield» из арт-редактора |
| URL-замены медиа | `uf:media-urls` | ссылки-оверрайды картинок (бесплатная генерация) |
| блоб-замены медиа | IndexedDB `uf-media` | картинки/видео/STL из арт-редактора |

**Дополнительные методы `UF_API`** (кроме REST-фасада):
`listMaterials()`, `getMaterial(grade)`, `updateMaterial(grade, patch)` —
паспорта материалов; `listGenQueue()`, `queueGen(ticket)`, `clearGenQueue()` —
очередь заявок на генерацию (исполняет Claude в терминале через Higgsfield).

**Серверная генерация** — Netlify Function `POST /api/generate`
(`netlify/functions/uf-generate.mts`): принимает `{prompt, width, height}`,
зовёт Replicate (env `REPLICATE_API_TOKEN`) и возвращает байты картинки.
Без ключа отвечает 501 — клиент падает на бесплатный генератор.

**Серверная очередь заявок** — Netlify Function `/api/queue`
(`netlify/functions/uf-queue.mts`, Netlify Blobs):
`POST {key, kind, prompt, width, height}` — положить заявку (одна на key);
`GET` — список; `DELETE` — очистить. Кнопка «Заказать ▸ Higgsfield»
шлёт сюда автоматически; исполняет Claude в терминале.

Итоговый каталог = `seed − hidden + overrides + custom`.

**Продакшен.** Контракт `UF_API` — REST-образный. Чтобы переехать на реальный
бэкенд, достаточно заменить реализацию методов в `src/lib/api.ts` на `fetch`
к серверу. **Интерфейс не меняется** — ни один компонент, стор или виджет
не заметит подмены: все они ходят через `api.*`, а сторы обновляются по
событию `onDataChanged`.

Точка входа для внешних систем: **`window.UF_API`** (экспонируется в
`src/main.tsx`). Открой консоль на любой странице — и ты уже интегрирован.

---

## 2. Справочник `window.UF_API`

Все методы синхронные (localStorage). После замены адаптера на fetch они
станут `Promise` — планируйте интеграции с `await`, хуже не будет.

### 2.1 Каталог обвесов

#### `listProducts(): Product[]`
Полный живой каталог (сид + оверлей).

```js
const kits = window.UF_API.listProducts();
console.table(kits.map(p => ({ sku: p.sku, name: p.name.en, price: p.price })));
```

#### `getProduct(id: string): Product | undefined`
Один товар по id.

```js
window.UF_API.getProduct('kit-widebody-s15');
```

#### `addProduct(p: Product): Product`
Добавляет custom-товар (флаг `custom: true` проставляется сам).

```js
window.UF_API.addProduct({
  id: 'kit-rear-diffuser-' + Date.now().toString(36),
  sku: 'UF-CST/99',
  name: { ru: 'Диффузор «ТЕРКА»', en: 'Diffuser "GRATER"' },
  desc: { ru: 'Карбон, пять клыков, злой.', en: 'Carbon, five strakes, angry.' },
  price: 890,
  weightGrams: 2400,
  heatC: 190,                // термостойкость, °C
  rarity: 'carbon',
  material: { ru: 'Карбон 2×2 твил, автоклав', en: '2×2 twill carbon, autoclave-cured' },
  fits: ['nissan-silvia-s15'],
  media: [{ type: 'image', url: 'https://…', seed: 'grater-0' }],
  hit: false,
});
```

#### `updateProduct(id: string, patch: Partial<Product>): Product | undefined`
Патчит товар. Custom-товары правятся напрямую, сид-товары — через оверлей
(`uf:products:overrides`), сид-файл не трогается.

```js
window.UF_API.updateProduct('kit-widebody-s15', { price: 399, hit: true });
```

#### `deleteProduct(id: string): void`
Custom-товар удаляется физически; сид-товар — прячется в `uf:products:hidden`.

```js
window.UF_API.deleteProduct('splitter-rx7');
```

### 2.2 Тачки (справочник фитмента)

#### `listCars(): CarModel[]`
Сид-модели + custom.

#### `addCar(c: CarModel): CarModel`
```js
window.UF_API.addCar({
  id: 'vaz-2101-' + Date.now().toString(36),
  make: 'LADA', model: '2101', years: '1970–1988',
  img: 'https://…',
});
```

#### `deleteCar(id: string): void`
Удаляет **только custom**-модели. Сид неприкосновенен, как гаражный запас.

### 2.3 Заказы

#### `listOrders(): Order[]`
Журнал заказов (свежие сверху).

#### `createOrder(order: Order): Order`
Кладёт заказ в журнал. В прототипе его вызывает checkout-заглушка.

```js
window.UF_API.createOrder({
  id: 'UF-' + Date.now().toString(36).toUpperCase(),
  items: [{ productId: 'wing-gt-supra', qty: 1, price: 289,
            name: { ru: 'Антикрыло', en: 'GT Wing' } }],
  subtotal: 289, discountPct: 0, total: 289,
  createdAt: Date.now(),
  status: 'cutting',   // 'cutting' | 'gluing' | 'shipping' | 'done'
});
```

### 2.4 Промокоды

#### `listPromos(): Promo[]`
Все зарегистрированные коды.

#### `registerPromo(promo: Promo): Promo`
Регистрирует (или перезаписывает по `code`). Источник пишите честно:
`'bot'`, `'admin'`, `'partner-widget'` — потом сами скажете спасибо.

```js
window.UF_API.registerPromo({ code: 'TRACKDAY10', pct: 10, source: 'bot' });
```

#### `validatePromo(code: string): Promo | undefined`
Регистронезависимая проверка. Именно её дёргает корзина.

```js
window.UF_API.validatePromo('trackday10'); // → { code, pct, source }
```

### 2.5 Массовый обмен

#### `exportCatalog(): string`
JSON-строка `{ "products": Product[], "cars": CarModel[] }` (pretty, 2 пробела).
Кнопка «Скачать catalog.json» в админке — это она.

#### `importCatalog(json: string): { products: number, cars: number }`
Принимает тот же формат. Позиции с сид-id отфильтровываются (сид не
перезаписывается), остальные **замещают** весь custom-слой. Возвращает
счётчики. Кидает исключение на битом JSON — ловите.

```js
const dump = window.UF_API.exportCatalog();
// … погоняли по внешним системам …
window.UF_API.importCatalog(dump); // → { products: 3, cars: 1 }
```

---

## 3. REST-фасад: `rest(method, path[, body])`

Для систем, которые думают маршрутами, а не методами. Тот же слой, другой вход:

```js
window.UF_API.rest('GET', '/catalog');
window.UF_API.rest('POST', '/promos', { code: 'BOXDAY', pct: 15, source: 'admin' });
```

| Метод | Путь | Эквивалент | Тело |
| --- | --- | --- | --- |
| GET | `/catalog` | `listProducts()` | — |
| POST | `/catalog` | `addProduct(body)` | `Product` |
| GET | `/catalog/:id` | `getProduct(id)` | — |
| DELETE | `/catalog/:id` | `deleteProduct(id)` | — |
| GET | `/cars` | `listCars()` | — |
| POST | `/cars` | `addCar(body)` | `CarModel` |
| GET | `/orders` | `listOrders()` | — |
| POST | `/orders` | `createOrder(body)` | `Order` |
| GET | `/promos` | `listPromos()` | — |
| POST | `/promos` | `registerPromo(body)` | `Promo` |

Неизвестный маршрут → `Error('UF_API: unknown route …')`. На проде этот фасад
меняется на настоящие HTTP-вызовы один в один — пути уже совпадают.

---

## 4. JSON-схемы

### 4.1 `Product`

```jsonc
{
  "id": "kit-widebody-s15",          // string, уникальный слаг
  "sku": "UF-KIT/01",                // string; custom из админки: "UF-CST/NN"
  "name":     { "ru": "…", "en": "…" },  // LocalText — оба языка обязательны
  "desc":     { "ru": "…", "en": "…" },
  "price": 3200,                     // number, USD
  "weightGrams": 6400,               // number — главная метрика перформанса
  "heatC": 200,                      // number — термостойкость, °C
  "rarity": "carbon",                // enum материала, см. ниже
  "material": { "ru": "…", "en": "…" },
  "fits": ["nissan-silvia-s15"],     // string[] — id из CarModel
  "media": [
    { "type": "image",               // "image" | "video"
      "url": "https://…",
      "seed": "kit-widebody-s15-a" } // опц.: сид для fallback-декали, если URL умер
  ],
  "hit": true,                       // опц.: штамп HIT
  "custom": true                     // опц.: проставляется слоем хранения, не вами
}
```

`rarity` (материал) — строго один из:

| Значение | Смысл |
| --- | --- |
| `abs` | АБС-пластик — бюджетно и ремонтопригодно |
| `composite` | Стеклокомпозит — золотая середина |
| `carbon` | Карбон — вершина пищевой цепи |

### 4.2 `CarModel`

```jsonc
{
  "id": "nissan-silvia-s15",   // string, слаг
  "make": "Nissan",            // string
  "model": "Silvia S15",       // string
  "years": "1999–2002",        // string, свободный формат
  "img": "https://…",          // string; битый URL → сгенерённая декаль
  "custom": true               // опц.: проставляется хранилищем
}
```

### 4.3 Формат exportCatalog / importCatalog

```jsonc
{
  "products": [ /* Product[] — полный живой каталог при экспорте */ ],
  "cars":     [ /* CarModel[] */ ]
}
```

Импорт: элементы с сид-id игнорируются, остальные становятся новым
custom-слоем (старый custom затирается целиком). Оба ключа опциональны.

---

## 5. Как подключить реальный Stripe и OAuth

Обе заглушки изолированы — меняется по одному файлу, остальной код не в курсе.

### 5.1 Stripe

Сейчас: `src/pages/Checkout.tsx` — косплей платёжной формы (маска карты,
детект бренда, 2 секунды «процессинга»), после чего создаётся `Order` через
`api.createOrder` и летит событие `checkout:success`.

Замена на Stripe Checkout Session:

1. На бэкенде: `POST /api/checkout` → `stripe.checkout.sessions.create({ line_items, mode: 'payment', success_url, cancel_url })`.
2. В `Checkout.tsx` вместо фейкового таймера — редирект на `session.url`.
3. Заказ создавайте в webhook `checkout.session.completed` (серверный
   `api.createOrder`), а на `success_url` дёргайте `bus.emit('checkout:success', …)` —
   бот и конфетти продолжат работать без правок.

Контракт `Order` уже готов к этому: `subtotal`, `discountPct`, `promo`, `total` —
всё, что нужно для `line_items` и купонов Stripe.

### 5.2 OAuth

Сейчас: `src/components/AuthModal.tsx` — демо-модалка (открывается по
`bus.emit('auth:open')`), «вход» рисует локального `User` c провайдером
`google | apple | github`.

Замена на реальный OAuth:

1. В модалке кнопка провайдера → редирект на `https://<provider>/authorize?...`
   (или на ваш `/auth/<provider>` при серверном флоу).
2. Callback-страница обменивает код на токен, собирает `User`
   (`{ id, name, email, avatar?, provider }`) и эмитит
   `bus.emit('auth:signed-in', { user })`.
3. Всё. Стор авторизации и остальной UI слушают шину, а не модалку.

### 5.3 UF_API поверх fetch

Финальный шаг продакшена: в `src/lib/api.ts` тело каждого метода меняется на
`fetch('/api' + path)` (маршруты из раздела 3 совпадают с путями фасада),
`onDataChanged` переезжает на WebSocket/SSE. Сигнатуры и типы — те же.

---

## 6. Шина событий (`src/lib/bus.ts`) — webhooks для бедных и виджетов

Внутренний pub/sub. Для сторонних виджетов, встроенных в страницу, это
локальный аналог webhooks: подписывайся и реагируй.

```js
// из консоли / виджета (bus доступен внутри приложения; снаружи —
// импортируйте src/lib/bus.ts в свой виджет при сборке)
bus.on('checkout:success', ({ orderId, total }) => {
  fetch('https://my-crm.example/hook', {
    method: 'POST',
    body: JSON.stringify({ orderId, total }),
  });
});
```

| Событие | Payload | Когда летит |
| --- | --- | --- |
| `page:change` | `{ path }` | смена маршрута |
| `product:view` | `{ productId }` | открыт товар |
| `product:linger` | `{ productId }` | юзер залип на товаре |
| `cart:add` | `{ productId }` | товар в корзине |
| `cart:abandon` | `{ total }` | уходит с полной корзиной |
| `exit:intent` | `{}` | мышь ушла за верх окна |
| `checkout:success` | `{ orderId, total }` | оплата прошла |
| `promo:grant` | `{ code, pct }` | бот выдал промокод |
| `auth:open` | `{}` | просьба открыть окно входа |
| `auth:signed-in` | `{ user }` | юзер вошёл |
| `garage:add` | `{ car }` | тачка добавлена в гараж |

Плюс низкоуровневое DOM-событие `uf:data-changed` (CustomEvent на `window`,
`detail: { key }`) — стреляет при любой записи в хранилище. Подписка-обёртка:
`onDataChanged(fn)` из `src/lib/api.ts` (ловит и cross-tab `storage`).

---

*UNDERGROUND FACTORY © CARBON DIV. Прототип: обвесы не существуют. API — существует.*
