/** Контент-завод рилсов (Админка → КОНТЕНТ). Namespace: content.* (+ ключ вкладки admin.tab.content) */
export default {
  ru: {
    'admin.tab.content': 'Контент',

    'content.title': 'КОНТЕНТ // ЦЕХ РИЛСОВ',
    'content.note': 'Собери заказ на вертикальный рилс 9:16: тачка, обвес, сценарий, музыка из радио, текст и CTA. «Заказать рилс» кладёт заявку в серверную очередь — Claude в терминале генерирует ролик, файл появится на полке ниже.',

    'content.form.title': 'ЗАКАЗ РИЛСА',
    'content.car': 'ТАЧКА',
    'content.product': 'ОБВЕС',
    'content.product.full': 'Полный кит — всё подходящее',
    'content.fullkit': 'полный кит',

    'content.scenario': 'СЦЕНАРИЙ',
    'content.scenario.beforeafter': 'До/после: сток → глитч-трансформация в обвес',
    'content.scenario.action': 'Трансформация в экшне',
    'content.scenario.custom': 'Свой промпт',
    'content.scene': 'ЭКШН',
    'content.scene.nightrace': 'ночная гонка по городу',
    'content.scene.drift': 'дрифт',
    'content.scene.chase': 'погоня',
    'content.customPrompt.ph': 'Опиши свой сценарий: что в кадре, какая динамика, какой финал…',

    'content.music': 'МУЗЫКА',
    'content.music.auto': 'Подобрать автоматически',

    'content.text': 'ТЕКСТ ПОВЕРХ',
    'content.text.slogans': 'Слоганы завода (авто)',
    'content.text.specs': 'Описание тачки и обвеса',
    'content.text.custom': 'Свой текст',
    'content.customText.ph': 'Текст, который ляжет поверх видео (короткие фразы, по одной на бит)…',

    'content.cta': 'CTA-ПЛАШКА',
    'content.cta.default': 'Код на скидку — у ПИТ-БОССА',

    'content.duration': 'ДЛИТЕЛЬНОСТЬ',
    'content.duration.s': '{n} с',
    'content.format': 'Формат фиксированный: 9:16 (720×1280), вертикаль.',

    'content.order': 'ЗАКАЗАТЬ РИЛС',
    'content.q.sending': 'ЗАЯВКА ▸ ОТПРАВКА…',
    'content.q.ok': 'ЗАЯВКА В ОЧЕРЕДИ ▸ исполнит Claude в терминале, рилс появится на полке',
    'content.q.err': 'ОЧЕРЕДЬ НЕДОСТУПНА ▸ попробуй позже',

    'content.plan.title': 'ПЛАН-СКЕЛЕТ',
    'content.plan.rule': 'Правило цеха: один бит = один кадр = одна мысль. Хук — кульминация в первом кадре.',
    'content.plan.hook': 'ХУК',
    'content.plan.beat': 'БИТ {n}',
    'content.plan.hookBA': '{car} уже в обвесе «{kit}» — финальный кадр вперёд, глитч-стоп.',
    'content.plan.hookAction': '{car} в обвесе «{kit}» — {scene}, кульминация первым кадром.',
    'content.plan.hookCustom': 'Кульминация твоего сценария с {car} — сразу первым кадром.',
    'content.plan.beatStock': 'Сток: {car} без обвеса, спокойный статичный кадр.',
    'content.plan.beatGlitch': 'Глитч-трансформация: детали «{kit}» собираются на кузове.',
    'content.plan.beatReveal': 'После: {car} в полном обвесе, медленный облёт камеры.',
    'content.plan.beatAction': 'Экшн: {scene} — машина в обвесе в движении.',
    'content.plan.customEmpty': '(промпт пуст — опиши сценарий в поле выше)',
    'content.plan.cta': 'Финальная плашка: «{cta}».',
    'content.plan.meta': 'Текст поверх: {text} ▸ музыка: {music} ▸ хронометраж: {dur} с, 9:16.',

    'content.shelf.title': 'ПОЛКА ГОТОВЫХ РИЛСОВ',
    'content.shelf.stats': 'НА ПОЛКЕ: {n}',
    'content.shelf.empty': 'Цех ждёт первый заказ — готовые рилсы появятся здесь.',
    'content.shelf.download': 'СКАЧАТЬ',
  },
  en: {
    'admin.tab.content': 'Content',

    'content.title': 'CONTENT // REEL FACTORY',
    'content.note': 'Build an order for a vertical 9:16 reel: car, body kit, scenario, music from the radio, overlay text and CTA. "Order reel" drops a ticket into the server queue — Claude generates the video in the terminal and the file lands on the shelf below.',

    'content.form.title': 'REEL ORDER',
    'content.car': 'CAR',
    'content.product': 'BODY KIT',
    'content.product.full': 'Full kit — everything that fits',
    'content.fullkit': 'full kit',

    'content.scenario': 'SCENARIO',
    'content.scenario.beforeafter': 'Before/after: stock → glitch transformation into the kit',
    'content.scenario.action': 'Transformation in action',
    'content.scenario.custom': 'Custom prompt',
    'content.scene': 'ACTION',
    'content.scene.nightrace': 'night street race',
    'content.scene.drift': 'drift',
    'content.scene.chase': 'chase',
    'content.customPrompt.ph': 'Describe your scenario: what is in frame, the dynamics, the finale…',

    'content.music': 'MUSIC',
    'content.music.auto': 'Pick automatically',

    'content.text': 'OVERLAY TEXT',
    'content.text.slogans': 'Factory slogans (auto)',
    'content.text.specs': 'Car and kit description',
    'content.text.custom': 'Custom text',
    'content.customText.ph': 'Text laid over the video (short phrases, one per beat)…',

    'content.cta': 'CTA CARD',
    'content.cta.default': 'Discount code — ask PIT-BOSS',

    'content.duration': 'DURATION',
    'content.duration.s': '{n} s',
    'content.format': 'Fixed format: 9:16 (720×1280), vertical.',

    'content.order': 'ORDER REEL',
    'content.q.sending': 'TICKET ▸ SENDING…',
    'content.q.ok': 'TICKET QUEUED ▸ Claude executes it in the terminal, the reel lands on the shelf',
    'content.q.err': 'QUEUE UNAVAILABLE ▸ try again later',

    'content.plan.title': 'PLAN SKELETON',
    'content.plan.rule': 'Shop rule: one beat = one shot = one idea. The hook is the climax in the very first frame.',
    'content.plan.hook': 'HOOK',
    'content.plan.beat': 'BEAT {n}',
    'content.plan.hookBA': '{car} already wearing "{kit}" — final shot first, glitch freeze.',
    'content.plan.hookAction': '{car} in the "{kit}" kit — {scene}, climax as the first frame.',
    'content.plan.hookCustom': 'The climax of your scenario with {car} — straight into the first frame.',
    'content.plan.beatStock': 'Stock: {car} without the kit, calm static shot.',
    'content.plan.beatGlitch': 'Glitch transformation: "{kit}" parts assemble onto the body.',
    'content.plan.beatReveal': 'After: {car} in the full kit, slow camera orbit.',
    'content.plan.beatAction': 'Action: {scene} — the kitted car in motion.',
    'content.plan.customEmpty': '(prompt is empty — describe the scenario in the field above)',
    'content.plan.cta': 'Final card: "{cta}".',
    'content.plan.meta': 'Overlay: {text} ▸ music: {music} ▸ runtime: {dur} s, 9:16.',

    'content.shelf.title': 'FINISHED REELS SHELF',
    'content.shelf.stats': 'ON SHELF: {n}',
    'content.shelf.empty': 'The shop is waiting for its first order — finished reels will appear here.',
    'content.shelf.download': 'DOWNLOAD',
  },
};
