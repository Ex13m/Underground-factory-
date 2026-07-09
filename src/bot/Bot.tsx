/**
 * «ПИТ-БОСС» — чат-виджет-рация, полевой связной завода.
 * Свёрнут: круглая кнопка-рация с фирменным ящиком запчастей и бейджем непрочитанных.
 * Развёрнут: панель .panel.rivets с лентой сообщений, быстрыми ответами и вводом.
 * Реплики — только через i18n ('bot.*'), логика торга — в brain.ts.
 */
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useI18n } from '../lib/i18n';
import { useUI } from '../store/ui';
import { useCart } from '../store/cart';
import { api } from '../lib/api';
import { bus } from '../lib/bus';
import {
  canPing,
  escalate,
  markGreeted,
  markPing,
  markSessionGreeted,
  matchIntent,
  pickBackGreeting,
  wasGreeted,
  wasSessionGreeted,
} from './brain';
import { PitBotAvatar } from './PitBot';
import '../styles/bot.css';

interface BotAction {
  labelKey: string;
  run: () => void;
}

interface Msg {
  id: number;
  from: 'bot' | 'user';
  /** i18n-ключ (бот и быстрые ответы) */
  key?: string;
  vars?: Record<string, string | number>;
  /** сырой текст пользователя из инпута */
  text?: string;
  promo?: { code: string; pct: number };
  actions?: BotAction[];
}

let msgSeq = 0;

/** Кликабельный чип промокода: копирование в буфер + галочка-фидбек. */
function PromoChip({ code, pct }: { code: string; pct: number }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const copy = () => {
    try {
      navigator.clipboard?.writeText(code).catch(() => {});
    } catch {
      /* нет буфера — код всё равно на экране */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="uf-bot-promowrap">
      <button type="button" className="uf-bot-promo" onClick={copy} title={t('bot.promo.copytitle')}>
        <span className="uf-bot-promo-code">{code}</span>
        <span className="uf-bot-promo-pct">−{pct}%</span>
        <span className="uf-bot-promo-ico" aria-hidden>{copied ? '✓' : '⧉'}</span>
      </button>
      <span className="uf-bot-promo-note">{copied ? t('bot.promo.copied') : t('bot.promo.note')}</span>
    </div>
  );
}

export function Bot() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const [bounce, setBounce] = useState(false);
  const [input, setInput] = useState('');

  const openRef = useRef(open);
  openRef.current = open;
  /** «Не мешай» — тихий режим на сессию: только бейдж, без подпрыгиваний */
  const quietRef = useRef(false);
  const queueRef = useRef<Msg[]>([]);
  const busyRef = useRef(false);
  const lingeredRef = useRef<Set<string>>(new Set());
  const fallbackRef = useRef(0);
  /** режим обратной связи: следующий ввод пользователя уходит на /api/feedback */
  const awaitFeedbackRef = useRef(false);
  /** последний непонятый текст — для кнопки «Передать вопрос владельцу» */
  const lastUnansweredRef = useRef('');
  const feedRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<number[]>([]);

  // ---- очередь сообщений бота с эффектом печати ----
  const pump = () => {
    if (busyRef.current) return;
    const next = queueRef.current.shift();
    if (!next) return;
    busyRef.current = true;
    setTyping(true);
    const delay = 600 + Math.random() * 600; // 0.6–1.2с «печатает»
    const tm = window.setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [...prev, next]);
      if (!openRef.current) {
        setUnread((u) => u + 1);
        if (!quietRef.current) setBounce(true);
      }
      busyRef.current = false;
      pump();
    }, delay);
    timersRef.current.push(tm);
  };

  const pushBot = (m: Omit<Msg, 'id' | 'from'>) => {
    queueRef.current.push({ ...m, id: ++msgSeq, from: 'bot' });
    pump();
  };

  const pushUser = (text?: string, key?: string) => {
    setMessages((prev) => [...prev, { id: ++msgSeq, from: 'user', text, key }]);
  };

  // ---- действия ----
  const doEscalate = () => {
    const r = escalate(); // регистрирует промокод + emit 'promo:grant'
    pushBot({
      key: r.key,
      promo: r.promo,
      actions: [{ labelKey: 'bot.qa.tocart', run: () => { window.location.hash = '#/cart'; } }],
    });
  };

  const goCatalog = () => {
    window.location.hash = '#/catalog';
    pushBot({ key: 'bot.reply.hits' });
  };

  const doDnd = () => {
    quietRef.current = true;
    setBounce(false);
    pushBot({ key: 'bot.reply.dnd' });
  };

  // ---- обратная связь ----

  /** POST на /api/feedback + честный ответ бота про итог доставки. */
  const sendFeedback = async (message: string) => {
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          page: window.location.hash,
          createdAt: Date.now(),
        }),
      });
      if (!res.ok) throw new Error(`http ${res.status}`);
      pushBot({ key: 'bot.feedback.sent', actions: defaultActions() });
    } catch {
      // локальный dev или обрыв сети — не врём, предлагаем позже
      pushBot({ key: 'bot.feedback.fail', actions: defaultActions() });
    }
  };

  /** Включает режим ожидания: следующий ввод уйдёт владельцу. */
  const askFeedback = () => {
    awaitFeedbackRef.current = true;
    pushBot({ key: 'bot.feedback.ask' });
  };

  const defaultActions = (): BotAction[] => [
    { labelKey: 'bot.qa.hits', run: goCatalog },
    { labelKey: 'bot.qa.discount', run: doEscalate },
    { labelKey: 'bot.qa.feedback', run: askFeedback },
  ];

  // ---- триггеры через bus ----
  useEffect(() => {
    const offs: Array<() => void> = [];

    // a) приветствие раз за визит, через 6 секунд:
    //    самый первый раз — легенда завода, дальше — продающий заход на сленге
    if (!wasSessionGreeted()) {
      const tm = window.setTimeout(() => {
        if (wasSessionGreeted()) return;
        markSessionGreeted();
        markPing();
        const first = !wasGreeted();
        if (first) markGreeted();
        pushBot({
          key: first ? 'bot.greet.first' : pickBackGreeting(),
          actions: [
            ...(first
              ? [{ labelKey: 'bot.qa.what', run: () => pushBot({ key: 'bot.reply.what' }) }]
              : []),
            { labelKey: 'bot.qa.hits', run: goCatalog },
            { labelKey: 'bot.qa.discount', run: doEscalate },
            { labelKey: 'bot.qa.dnd', run: doDnd },
          ],
        });
      }, 6000);
      timersRef.current.push(tm);
    }

    // b) залип на товаре
    offs.push(
      bus.on('product:linger', (p) => {
        const productId = p?.productId as string | undefined;
        if (!productId || lingeredRef.current.has(productId)) return;
        if (!canPing()) return;
        const product = api.getProduct(productId);
        if (!product) return;
        lingeredRef.current.add(productId);
        markPing();
        const name = product.name[useUI.getState().lang];
        pushBot({
          key: 'bot.linger',
          vars: { name },
          actions: [
            {
              labelKey: 'bot.qa.buy',
              run: () => {
                useCart.getState().add(productId);
                pushBot({ key: 'bot.linger.added', vars: { name } });
              },
            },
            { labelKey: 'bot.qa.expensive', run: doEscalate },
          ],
        });
      }),
    );

    // c) брошенная корзина → окрик + следующий шаг торга
    offs.push(
      bus.on('cart:abandon', (p) => {
        if (!canPing()) return;
        markPing();
        pushBot({ key: 'bot.abandon', vars: { total: p?.total ?? 0 } });
        doEscalate();
      }),
    );

    // d) успешный заказ
    offs.push(
      bus.on('checkout:success', (p) => {
        pushBot({ key: 'bot.checkout', vars: { orderId: p?.orderId ?? '', total: p?.total ?? 0 } });
      }),
    );

    // e) вход в аккаунт — приветствие по имени
    offs.push(
      bus.on('auth:signed-in', (p) => {
        const name = (p?.user?.name as string | undefined)?.split(' ')[0] ?? '';
        pushBot({ key: 'bot.signedin', vars: { name } });
      }),
    );

    // f) тачка в гараже — идеи под неё
    offs.push(
      bus.on('garage:add', (p) => {
        const car = p?.car;
        if (!car) return;
        const carParam = String(car.modelId ?? car.id ?? '');
        pushBot({
          key: 'bot.garage',
          vars: { make: car.make ?? '', model: car.model ?? '' },
          actions: [
            {
              labelKey: 'bot.qa.garage',
              run: () => { window.location.hash = `#/catalog?car=${encodeURIComponent(carParam)}`; },
            },
          ],
        });
      }),
    );

    return () => {
      offs.forEach((f) => f());
      timersRef.current.forEach((tm) => window.clearTimeout(tm));
      timersRef.current = [];
      busyRef.current = false;
      setTyping(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // автоскролл ленты вниз
  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing, open]);

  const toggleOpen = () => {
    setOpen((o) => {
      const next = !o;
      if (next) {
        setUnread(0);
        setBounce(false);
      }
      return next;
    });
  };

  // ---- обработка ввода пользователя ----
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    pushUser(text);
    // режим обратной связи: этот ввод — сообщение владельцу, интенты не трогаем
    if (awaitFeedbackRef.current) {
      awaitFeedbackRef.current = false;
      void sendFeedback(text);
      return;
    }
    switch (matchIntent(text)) {
      case 'discount':
        doEscalate();
        break;
      case 'material':
        pushBot({ key: 'bot.reply.what' });
        break;
      case 'heat':
        pushBot({ key: 'bot.reply.heat' });
        break;
      case 'hello':
        pushBot({ key: 'bot.reply.hello', actions: defaultActions() });
        break;
      case 'hits':
        goCatalog();
        break;
      // навигация голосом продажника: открываем раздел и дожимаем репликой
      case 'open-cart':
        window.location.hash = '#/cart';
        pushBot({ key: 'bot.nav.cart', actions: [{ labelKey: 'bot.qa.discount', run: doEscalate }] });
        break;
      case 'open-tv':
        window.location.hash = '#/tv';
        pushBot({ key: 'bot.nav.tv' });
        break;
      case 'open-garage':
        window.location.hash = '#/account';
        pushBot({ key: 'bot.nav.garage' });
        break;
      case 'open-account':
        window.location.hash = '#/account';
        pushBot({ key: 'bot.nav.account' });
        break;
      case 'open-admin':
        window.location.hash = '#/admin';
        pushBot({ key: 'bot.nav.admin' });
        break;
      case 'open-home':
        window.location.hash = '#/';
        pushBot({ key: 'bot.nav.home', actions: defaultActions() });
        break;
      default: {
        // непонятый вопрос: запоминаем и предлагаем передать владельцу
        lastUnansweredRef.current = text;
        const i = (fallbackRef.current++ % 3) + 1;
        pushBot({ key: `bot.fallback.${i}` });
        pushBot({
          key: 'bot.fallback.forward',
          actions: [
            {
              labelKey: 'bot.qa.forward',
              run: () => { void sendFeedback(`unanswered: ${lastUnansweredRef.current}`); },
            },
            ...defaultActions(),
          ],
        });
      }
    }
  };

  const runAction = (a: BotAction) => {
    pushUser(undefined, a.labelKey);
    a.run();
  };

  const last = messages[messages.length - 1];
  const quickActions = !typing && last?.from === 'bot' && last.actions?.length ? last.actions : null;

  return (
    <div className="uf-bot" data-testid="bot">
      {!open && (
        <button
          type="button"
          className={`uf-bot-fab${bounce ? ' bounce' : ''}`}
          onClick={toggleOpen}
          aria-label={t('bot.fab')}
          title={t('bot.fab')}
          data-testid="bot-fab"
        >
          <PitBotAvatar />
          {unread > 0 && <span className="uf-bot-badge">{unread}</span>}
        </button>
      )}

      {open && (
        <div className="uf-bot-panel panel rivets" role="dialog" aria-label={t('bot.unit')}>
          <div className="uf-bot-head">
            <span className="uf-bot-lamp" aria-hidden />
            <span className="uf-bot-title">{t('bot.unit')}</span>
            <button type="button" className="uf-bot-close" onClick={toggleOpen} aria-label={t('bot.close')}>
              ✕
            </button>
          </div>

          <div className="uf-bot-feed" ref={feedRef}>
            {messages.map((m) => (
              <div key={m.id} className={`uf-bot-msg ${m.from}`}>
                <div className="uf-bot-msg-text">
                  {m.from === 'user' ? (m.key ? t(m.key) : m.text) : t(m.key ?? '', m.vars)}
                </div>
                {m.promo && <PromoChip code={m.promo.code} pct={m.promo.pct} />}
              </div>
            ))}
            {typing && (
              <div className="uf-bot-msg bot uf-bot-typing" aria-label={t('bot.typing')}>
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            )}
          </div>

          {quickActions && (
            <div className="uf-bot-quick">
              {quickActions.map((a) => (
                <button key={a.labelKey} type="button" onClick={() => runAction(a)}>
                  {t(a.labelKey)}
                </button>
              ))}
            </div>
          )}

          <form className="uf-bot-inputrow" onSubmit={onSubmit}>
            <input
              className="field"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('bot.input.placeholder')}
              aria-label={t('bot.input.placeholder')}
            />
            <button className="btn" type="submit">
              {t('bot.send')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
