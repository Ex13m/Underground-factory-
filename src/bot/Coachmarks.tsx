/**
 * Умные подсказки-стикеры (coachmarks).
 * Одна подсказка за раз, показ через 2с после условия, позиционирование
 * по getBoundingClientRect элемента [data-hint=...], пересчёт на resize/scroll.
 * Прогресс — в useUI.seenHints/markHint. В calm-режиме работают без анимаций.
 */
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../lib/i18n';
import { useUI } from '../store/ui';
import { useAuth } from '../store/auth';
import { bus } from '../lib/bus';
import '../styles/bot.css';

const HINTS: Record<string, { target: string; key: string }> = {
  'nav-catalog': { target: 'nav-catalog', key: 'hints.nav-catalog' },
  cart: { target: 'cart', key: 'hints.cart' },
  'nav-account': { target: 'nav-account', key: 'hints.nav-account' },
  'garage-empty': { target: 'nav-account', key: 'hints.garage-empty' },
};
const ALL_HINT_IDS = Object.keys(HINTS);
const STICKER_W = 264;
const SHOW_DELAY_MS = 2000;

export function Coachmarks() {
  const { t } = useI18n();
  const markHint = useUI((s) => s.markHint);
  // подписка на seenHints — чтобы «Больше не подсказывать» из другого места тоже скрывало
  const seenHints = useUI((s) => s.seenHints);

  const [active, setActive] = useState<string | null>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, arrow: 24 });
  const activeRef = useRef<string | null>(null);
  const queueRef = useRef<string[]>([]);
  const timersRef = useRef<number[]>([]);

  const pump = () => {
    if (activeRef.current) return;
    while (queueRef.current.length) {
      const id = queueRef.current.shift()!;
      if (useUI.getState().seenHints[id]) continue;
      // элемент не найден — пропускаем тихо
      const el = document.querySelector(`[data-hint="${HINTS[id].target}"]`);
      if (!el) continue;
      activeRef.current = id;
      setActive(id);
      return;
    }
  };

  const request = (id: string) => {
    if (useUI.getState().seenHints[id]) return;
    if (activeRef.current !== id && !queueRef.current.includes(id)) {
      queueRef.current.push(id);
    }
    const tm = window.setTimeout(pump, SHOW_DELAY_MS);
    timersRef.current.push(tm);
  };

  const close = (id: string) => {
    markHint(id);
    activeRef.current = null;
    setActive(null);
    const tm = window.setTimeout(pump, 800);
    timersRef.current.push(tm);
  };

  const dismissAll = () => {
    ALL_HINT_IDS.forEach((id) => markHint(id));
    queueRef.current = [];
    activeRef.current = null;
    setActive(null);
  };

  // ---- сценарии ----
  useEffect(() => {
    const offs = [
      bus.on('page:change', (p) => {
        const path = p?.path as string | undefined;
        if (path === '/') request('nav-catalog');
        if (path === '/account') {
          const { user, garage } = useAuth.getState();
          if (user && garage.length === 0) request('garage-empty');
        }
      }),
      bus.on('cart:add', () => request('cart')),
      bus.on('auth:signed-in', () => request('nav-account')),
    ];
    return () => {
      offs.forEach((f) => f());
      timersRef.current.forEach((tm) => window.clearTimeout(tm));
      timersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // если подсказку пометили извне — прячем
  useEffect(() => {
    if (active && seenHints[active]) {
      activeRef.current = null;
      setActive(null);
    }
  }, [active, seenHints]);

  // ---- позиционирование по цели + пересчёт на resize/scroll ----
  useEffect(() => {
    if (!active) return;
    const target = HINTS[active].target;
    const update = () => {
      const el = document.querySelector(`[data-hint="${target}"]`);
      if (!el) {
        activeRef.current = null;
        setActive(null);
        return;
      }
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const width = Math.min(STICKER_W, vw - 16);
      const cx = r.left + r.width / 2;
      const left = Math.min(Math.max(8, cx - width / 2), Math.max(8, vw - width - 8));
      const top = r.bottom + 14;
      const arrow = Math.min(Math.max(16, cx - left), width - 16);
      setPos({ top, left, arrow });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      className="uf-hint"
      style={{ top: pos.top, left: pos.left }}
      role="note"
      data-testid={`hint-${active}`}
    >
      <span className="uf-hint-arrow" style={{ left: pos.arrow }} aria-hidden />
      <span className="uf-hint-tape" aria-hidden />
      <div className="uf-hint-body panel inverse rivets">
        <div className="uf-hint-text">{t(HINTS[active].key)}</div>
        <div className="uf-hint-actions">
          <button type="button" className="btn dark uf-hint-ok" onClick={() => close(active)}>
            {t('hints.gotit')}
          </button>
          <button type="button" className="uf-hint-never" onClick={dismissAll}>
            {t('hints.never')}
          </button>
        </div>
      </div>
    </div>
  );
}
