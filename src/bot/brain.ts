/**
 * Мозг «Пит-босса» — rule-based state machine.
 * Здесь живут: торг (эскалация скидки, persist в localStorage),
 * анти-спам-троттлинг проактивных вылазок и распознавание намерений
 * по ключевым словам (ru/en).
 */
import { api } from '../lib/api';
import { bus } from '../lib/bus';

const LS_GREETED = 'uf:bot:greeted';
const SS_GREETED = 'uf:bot:sgreet';
const LS_HAGGLE = 'uf:bot:haggle';
const LS_LAST_PING = 'uf:bot:last-ping';

/** сколько вариантов возвращного приветствия в словаре (bot.greet.backN) */
export const GREET_BACK_COUNT = 4;

/** минимальный интервал между проактивными вылазками */
export const PING_INTERVAL_MS = 45_000;

/** Лестница торга: шаг → код, процент, реплика. */
export const HAGGLE_LADDER = [
  { code: 'CARBON5', pct: 5, key: 'bot.haggle.step1' },
  { code: 'CARBON10', pct: 10, key: 'bot.haggle.step2' },
  { code: 'PITSTOP15', pct: 15, key: 'bot.haggle.step3' },
] as const;

export interface HaggleResult {
  key: string;
  promo?: { code: string; pct: number };
}

function lsGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function lsSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* приватный режим — молчим */
  }
}

// ---- приветствие ----

export function wasGreeted(): boolean {
  return lsGet(LS_GREETED) === '1';
}

export function markGreeted() {
  lsSet(LS_GREETED, '1');
}

/** приветствие показывается раз за визит (sessionStorage), а не раз навсегда */
export function wasSessionGreeted(): boolean {
  try {
    return sessionStorage.getItem(SS_GREETED) === '1';
  } catch {
    return true; // приватный режим — лучше промолчать, чем спамить
  }
}

export function markSessionGreeted() {
  try {
    sessionStorage.setItem(SS_GREETED, '1');
  } catch {
    /* приватный режим */
  }
}

/** ключ возвращного приветствия — случайный продающий заход */
export function pickBackGreeting(): string {
  return `bot.greet.back${1 + Math.floor(Math.random() * GREET_BACK_COUNT)}`;
}

// ---- эскалация скидки ----

export function getHaggleStep(): number {
  const n = Number(lsGet(LS_HAGGLE));
  return Number.isFinite(n) && n > 0 ? Math.min(n, HAGGLE_LADDER.length) : 0;
}

/**
 * Следующий шаг торга. Регистрирует промокод через api.registerPromo
 * (иначе он не сработает в корзине) и эмитит 'promo:grant'.
 * Когда лестница кончилась — возвращает финальную отповедь с последним кодом.
 */
export function escalate(): HaggleResult {
  const step = getHaggleStep();
  if (step >= HAGGLE_LADDER.length) {
    const last = HAGGLE_LADDER[HAGGLE_LADDER.length - 1];
    return { key: 'bot.haggle.done', promo: { code: last.code, pct: last.pct } };
  }
  const s = HAGGLE_LADDER[step];
  api.registerPromo({ code: s.code, pct: s.pct, source: 'bot' });
  bus.emit('promo:grant', { code: s.code, pct: s.pct });
  lsSet(LS_HAGGLE, String(step + 1));
  return { key: s.key, promo: { code: s.code, pct: s.pct } };
}

// ---- троттлинг проактивности ----

export function canPing(): boolean {
  const last = Number(lsGet(LS_LAST_PING));
  return !Number.isFinite(last) || Date.now() - last >= PING_INTERVAL_MS;
}

export function markPing() {
  lsSet(LS_LAST_PING, String(Date.now()));
}

// ---- распознавание намерений ----

export type Intent =
  | 'discount'
  | 'material'
  | 'heat'
  | 'hello'
  | 'hits'
  | 'open-cart'
  | 'open-tv'
  | 'open-garage'
  | 'open-account'
  | 'open-admin'
  | 'open-home'
  | 'fallback';

/** порядок важен: скидка перекрывает всё, температура — раньше материала,
    навигация («открой…») — раньше общих тем */
const INTENTS: Array<[Intent, RegExp]> = [
  ['discount', /скидк|скидо|дорог|дешевл|дешёв|промокод|промик|торг|discount|expensive|cheaper|cheap|promo|coupon|deal/i],
  ['open-cart', /корзин|cart|basket/i],
  ['open-tv', /видеосалон|видик|телек|эфир|\bтв\b|\btv\b|cctv|салон/i],
  ['open-garage', /гараж|garage/i],
  ['open-account', /кабинет|аккаунт|профил|заказ(ы|ов)|избранн|account|profile|orders|favou?rites/i],
  ['open-admin', /админ|admin/i],
  ['open-home', /главн|домой|на старт|home|main page/i],
  ['heat', /термо|жар|градус|температур|плав|нагрев|выхлоп|heat|temperature|melt|degrees|exhaust|thermal/i],
  ['material', /карбон|композит|абс|пластик|стекло|материал|завод|легенд|carbon|composite|abs|plastic|fibre|fiber|material|factory|legend/i],
  ['hits', /хит|каталог|покаж|ассортимент|обвес|товар|деталь|запчаст|топ\b|hits?\b|catalog|catalogue|show|best|kit|parts?\b|top\b/i],
  ['hello', /привет|здоров|здравств|дратути|салют|добрый (день|вечер|утро)|hello|\bhi\b|\bhey\b|\byo\b|sup\b/i],
];

export function matchIntent(text: string): Intent {
  for (const [intent, re] of INTENTS) {
    if (re.test(text)) return intent;
  }
  return 'fallback';
}
