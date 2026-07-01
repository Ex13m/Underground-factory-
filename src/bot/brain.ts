/**
 * Мозг «Дяди Картона» — rule-based state machine.
 * Здесь живут: торг (эскалация скидки, persist в localStorage),
 * анти-спам-троттлинг проактивных вылазок и распознавание намерений
 * по ключевым словам (ru/en).
 */
import { api } from '../lib/api';
import { bus } from '../lib/bus';

const LS_GREETED = 'uf:bot:greeted';
const LS_HAGGLE = 'uf:bot:haggle';
const LS_LAST_PING = 'uf:bot:last-ping';

/** минимальный интервал между проактивными вылазками */
export const PING_INTERVAL_MS = 45_000;

/** Лестница торга: шаг → код, процент, реплика. */
export const HAGGLE_LADDER = [
  { code: 'KARTON5', pct: 5, key: 'bot.haggle.step1' },
  { code: 'KARTON10', pct: 10, key: 'bot.haggle.step2' },
  { code: 'SUHOY15', pct: 15, key: 'bot.haggle.step3' },
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

export type Intent = 'discount' | 'cardboard' | 'rain' | 'hello' | 'hits' | 'fallback';

/** порядок важен: скидка перекрывает всё, вода — раньше картона */
const INTENTS: Array<[Intent, RegExp]> = [
  ['discount', /скидк|скидо|дорог|дешевл|дешёв|промокод|промик|торг|discount|expensive|cheaper|cheap|promo|coupon|deal/i],
  ['rain', /дожд|мокр|промок|ливен|ливн|лужа|луж|вода|воды|воде|воду|водо|rain|water|wet|soak|moist/i],
  ['cardboard', /картон|карбон|бумаг|гофр|материал|коробк|cardboard|carbon|paper|material|box/i],
  ['hits', /хит|каталог|покаж|ассортимент|топ\b|товар|hits?\b|catalog|catalogue|show|best|top\b/i],
  ['hello', /привет|здоров|здравств|дратути|салют|добрый (день|вечер|утро)|hello|\bhi\b|\bhey\b|\byo\b|sup\b/i],
];

export function matchIntent(text: string): Intent {
  for (const [intent, re] of INTENTS) {
    if (re.test(text)) return intent;
  }
  return 'fallback';
}
