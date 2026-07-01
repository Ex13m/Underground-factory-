/** Namespace: bot.* — реплики «Пит-босса», полевого связного завода. */
export default {
  ru: {
    'bot.unit': 'UNIT: PIT_BOSS // ONLINE',
    'bot.fab': 'Рация: Пит-босс на связи',
    'bot.close': 'Свернуть рацию',
    'bot.input.placeholder': 'Говори, канал защищён…',
    'bot.send': 'ЭФИР',
    'bot.typing': 'Пит-босс печатает…',

    'bot.greet.first': 'Тссс. Пит-босс на связи. Ты попал на подпольный завод: днём — OEM-запчасти, ночью — обвесы, о которых молчат каталоги. Чего надо — говори быстро, частоту пасут.',

    'bot.qa.what': 'Что за завод?',
    'bot.qa.hits': 'Покажи хиты',
    'bot.qa.dnd': 'Не мешай',
    'bot.qa.buy': 'Уговорил',
    'bot.qa.expensive': 'Дорого',
    'bot.qa.discount': 'Дай скидку',
    'bot.qa.tocart': 'В корзину',
    'bot.qa.garage': 'Подобрать под неё',

    'bot.reply.what': 'Легенда короткая: подпольный завод. Днём — OEM-запчасти, ночью — обвесы, о которых молчат каталоги. Карбон, композит, АБС — тот же автоклав, что печёт детали для заводских команд. Только без наценки за шильдик.',
    'bot.reply.heat': 'Термостойкость — святое. АБС держит до 90°C, композит — до 140, карбон живёт и при 200+. Над горячим выхлопом и на летнем треке бери карбон — он не поведётся, даже когда асфальт плывёт.',
    'bot.reply.hello': 'На связи. Опции простые: хиты, скидка, легенда про завод. Что берём?',
    'bot.reply.dnd': 'Принял. Ухожу в радиомолчание. Замигаю лампочкой, только если случится что-то серьёзное.',
    'bot.reply.hits': 'Курс на каталог проложен. Хиты — то, что формовали лучшие руки завода. Смотри, но не облизывайся.',

    'bot.linger': 'Вижу, залип на {name}. Бери — в карбоне она ещё злее, а партия не вечная.',
    'bot.linger.added': '{name} — в корзине. С тебя одно: ездить, а не хранить.',
    'bot.abandon': 'Стоять. Корзина на {total}$ стоит без дела. Ещё немного — и партию заберут быстрые.',
    'bot.checkout': 'Заказ {orderId} ушёл в цех. PHASE—02 запущен. Автоклав уже греется.',
    'bot.signedin': 'О, {name} на частоте. Завод своих помнит: гараж, заказы, избранное — всё в кабинете.',
    'bot.garage': '{make} {model}? Уважаю. У меня на неё есть пара идей.',

    'bot.haggle.step1': 'Ладно, уломал. Личная скидка 5%. Только никому — у меня репутация.',
    'bot.haggle.step2': 'Ты жёсткий переговорщик. 10%. Больше не проси.',
    'bot.haggle.step3': 'Всё. 15%. Торгую себе в убыток, но уважаю дерзких.',
    'bot.haggle.done': 'Лимит. Ниже 15% не даёт даже директор завода, а он карбон голыми руками гнёт. Твой код при тебе — пользуйся.',

    'bot.promo.note': 'вводи в корзине',
    'bot.promo.copied': 'скопировано',
    'bot.promo.copytitle': 'Скопировать код',

    'bot.fallback.1': 'Помехи на линии, передачу не разобрал. Могу показать хиты или выбить скидку — это я умею без помех.',
    'bot.fallback.2': 'Такому меня завод не учил. Зато я знаю, где хиты, и умею торговаться до скрипа карбона.',
    'bot.fallback.3': 'Шифруешься? Уважаю. Но проще прямым текстом: «хиты» или «скидка».',
  },
  en: {
    'bot.unit': 'UNIT: PIT_BOSS // ONLINE',
    'bot.fab': 'Radio: the pit boss is on the line',
    'bot.close': 'Collapse the radio',
    'bot.input.placeholder': 'Speak, the channel is secure…',
    'bot.send': 'SEND',
    'bot.typing': 'The pit boss is typing…',

    'bot.greet.first': 'Psst. Pit boss here. You found the underground factory: OEM parts by day, body kits the catalogs stay silent about by night. Talk fast — this frequency is being watched.',

    'bot.qa.what': 'What factory?',
    'bot.qa.hits': 'Show the hits',
    'bot.qa.dnd': 'Leave me alone',
    'bot.qa.buy': 'You got me',
    'bot.qa.expensive': 'Too pricey',
    'bot.qa.discount': 'Gimme a discount',
    'bot.qa.tocart': 'To cart',
    'bot.qa.garage': 'Fit my ride',

    'bot.reply.what': 'The legend is short: an underground factory. OEM parts by day, body kits the catalogs stay silent about by night. Carbon, composite, ABS — the same autoclave that cures parts for factory teams. Just without the badge tax.',
    'bot.reply.heat': 'Heat resistance is sacred. ABS holds up to 90°C, composite up to 140, carbon lives past 200. Over a hot exhaust or on a summer track day, take carbon — it will not warp even when the tarmac melts.',
    'bot.reply.hello': 'On the line. The options are simple: hits, a discount, or the factory legend. What will it be?',
    'bot.reply.dnd': 'Copy that. Going radio silent. I will blink the lamp only if something serious comes up.',
    'bot.reply.hits': 'Course set for the catalog. The hits were molded by the best hands of the factory. Look, but do not drool.',

    'bot.linger': 'I see you glued to {name}. Grab it — it is even meaner in carbon, and the batch will not last.',
    'bot.linger.added': '{name} is in the cart. One rule: drive it, do not shelf it.',
    'bot.abandon': 'Freeze. A ${total} cart is sitting idle over there. A bit longer and the fast guys take the batch.',
    'bot.checkout': 'Order {orderId} hit the shop floor. PHASE—02 engaged. The autoclave is already heating up.',
    'bot.signedin': 'Oh, {name} is on the frequency. The factory remembers its own: garage, orders, favorites — all in your account.',
    'bot.garage': '{make} {model}? Respect. I have a couple of ideas for that one.',

    'bot.haggle.step1': 'Fine, you got me. Personal 5% off. Tell no one — I have a reputation.',
    'bot.haggle.step2': 'You are a tough negotiator. 10%. Do not ask again.',
    'bot.haggle.step3': 'That is it. 15%. I am selling at a loss, but I respect the bold.',
    'bot.haggle.done': 'Hard limit. Even the factory director will not go below 15%, and he bends carbon bare-handed. Your code still works — use it.',

    'bot.promo.note': 'enter it in the cart',
    'bot.promo.copied': 'copied',
    'bot.promo.copytitle': 'Copy the code',

    'bot.fallback.1': 'Static on the line, could not parse that. I can show you the hits or squeeze out a discount — that I do with zero static.',
    'bot.fallback.2': 'The factory never trained me for that. But I know where the hits are and I haggle until the carbon creaks.',
    'bot.fallback.3': 'Talking in code? Respect. But it is easier straight up: "hits" or "discount".',
  },
} as { ru: Record<string, string>; en: Record<string, string> };
