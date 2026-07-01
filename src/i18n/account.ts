/** Namespace: account.* — личный кабинет, гараж, заказы, избранное, демо-OAuth. */
export default {
  ru: {
    // ---- guest / invite ----
    'account.invite.tape': 'ACCESS DENIED',
    'account.invite.title': 'Пилот не опознан',
    'account.invite.text': 'Без идентификации в гараж не пускаем. Там карбон, а карбон любит своих.',
    'account.invite.cta': 'Пройти идентификацию',

    // ---- profile ----
    'account.phase': 'PHASE—03 // ГАРАЖНЫЙ СЕКТОР',
    'account.title': 'Кабинет',
    'account.pilot': 'PILOT ID // UF-{id}',
    'account.provider': 'ПРОВАЙДЕР',
    'account.signout': 'Выйти',

    // ---- garage ----
    'account.garage.title': 'Гараж',
    'account.garage.label': 'СЕКЦИЯ A // ТЕХНИКА',
    'account.garage.active': 'ACTIVE',
    'account.garage.setActive': 'Сделать активной',
    'account.garage.remove': 'Убрать из гаража',
    'account.garage.pick': 'Подобрать обвес',
    'account.garage.empty.title': 'ГАРАЖ ПУСТ. ЭХО.',
    'account.garage.empty.text': 'Даже у пит-босса есть «Жигули». Добавь тачку — каталог подстроится под неё.',
    'account.garage.add.title': 'Поставить тачку',
    'account.garage.add.select': 'Выбрать из списка UF',
    'account.garage.add.manual': '— СВОЯ ТАЧКА (ручной ввод) —',
    'account.garage.add.make': 'Марка',
    'account.garage.add.model': 'Модель',
    'account.garage.add.year': 'Год',
    'account.garage.add.img': 'URL фото (необязательно)',
    'account.garage.add.submit': 'В гараж',
    'account.garage.add.err': 'Марка и модель обязательны. Мы же не телепаты.',

    // ---- orders ----
    'account.orders.title': 'Заказы',
    'account.orders.label': 'СЕКЦИЯ B // ПРОИЗВОДСТВО',
    'account.orders.empty.title': 'ЗАКАЗОВ НЕТ',
    'account.orders.empty.text': 'Цех простаивает, автоклав остывает. Исправь это.',
    'account.orders.empty.cta': 'В каталог',
    'account.orders.qty': '× {n}',
    'account.orders.total': 'Итого',
    'account.orders.discount': 'скидка −{pct}%',

    // ---- favorites ----
    'account.fav.title': 'Избранное',
    'account.fav.label': 'СЕКЦИЯ C // ХОТЕЛКИ',
    'account.fav.empty.title': 'ПУСТО. НИ ОДНОЙ ХОТЕЛКИ.',
    'account.fav.empty.text': 'Сердечки бесплатные, в отличие от карбона. Жми смелее.',
    'account.fav.remove': 'Разлюбить',

    // ---- auth modal ----
    'account.auth.title': 'Идентификация пилота',
    'account.auth.tape': 'CHECKPOINT',
    'account.auth.subtitle': 'Выбери протокол входа. Всё по-взрослому, но понарошку.',
    'account.auth.google': 'Continue with Google',
    'account.auth.apple': 'Continue with Apple',
    'account.auth.github': 'Continue with GitHub',
    'account.auth.demo': 'DEMO MODE // real OAuth = замена адаптера',
    'account.auth.redirect': 'REDIRECTING → {host} …',
    'account.auth.handshake': 'HANDSHAKE // TOKEN // OK',
    'account.auth.close': 'Закрыть',
  },
  en: {
    // ---- guest / invite ----
    'account.invite.tape': 'ACCESS DENIED',
    'account.invite.title': 'Pilot not identified',
    'account.invite.text': 'No ID — no garage. There is carbon in there, and carbon trusts its own.',
    'account.invite.cta': 'Identify yourself',

    // ---- profile ----
    'account.phase': 'PHASE—03 // GARAGE SECTOR',
    'account.title': 'Account',
    'account.pilot': 'PILOT ID // UF-{id}',
    'account.provider': 'PROVIDER',
    'account.signout': 'Sign out',

    // ---- garage ----
    'account.garage.title': 'Garage',
    'account.garage.label': 'SECTION A // MACHINES',
    'account.garage.active': 'ACTIVE',
    'account.garage.setActive': 'Set active',
    'account.garage.remove': 'Remove from garage',
    'account.garage.pick': 'Find a kit',
    'account.garage.empty.title': 'GARAGE IS EMPTY. ECHO.',
    'account.garage.empty.text': 'Even the pit boss owns a Lada. Add a car — the catalog will adapt to it.',
    'account.garage.add.title': 'Park a car',
    'account.garage.add.select': 'Pick from the UF list',
    'account.garage.add.manual': '— MY OWN CAR (manual entry) —',
    'account.garage.add.make': 'Make',
    'account.garage.add.model': 'Model',
    'account.garage.add.year': 'Year',
    'account.garage.add.img': 'Photo URL (optional)',
    'account.garage.add.submit': 'Into the garage',
    'account.garage.add.err': 'Make and model are required. We are not psychics.',

    // ---- orders ----
    'account.orders.title': 'Orders',
    'account.orders.label': 'SECTION B // PRODUCTION',
    'account.orders.empty.title': 'NO ORDERS',
    'account.orders.empty.text': 'The shop floor is idle, the autoclave is cooling down. Fix that.',
    'account.orders.empty.cta': 'To catalog',
    'account.orders.qty': '× {n}',
    'account.orders.total': 'Total',
    'account.orders.discount': 'discount −{pct}%',

    // ---- favorites ----
    'account.fav.title': 'Favorites',
    'account.fav.label': 'SECTION C // WANTS',
    'account.fav.empty.title': 'EMPTY. NOT A SINGLE WANT.',
    'account.fav.empty.text': 'Hearts are free, unlike carbon. Click bravely.',
    'account.fav.remove': 'Unlove',

    // ---- auth modal ----
    'account.auth.title': 'Pilot identification',
    'account.auth.tape': 'CHECKPOINT',
    'account.auth.subtitle': 'Pick your sign-in protocol. Looks serious, works pretend.',
    'account.auth.google': 'Continue with Google',
    'account.auth.apple': 'Continue with Apple',
    'account.auth.github': 'Continue with GitHub',
    'account.auth.demo': 'DEMO MODE // real OAuth = swap the adapter',
    'account.auth.redirect': 'REDIRECTING → {host} …',
    'account.auth.handshake': 'HANDSHAKE // TOKEN // OK',
    'account.auth.close': 'Close',
  },
} as { ru: Record<string, string>; en: Record<string, string> };
