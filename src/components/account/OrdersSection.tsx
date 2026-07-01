/**
 * СЕКЦИЯ B // ЗАКАЗЫ — живой статус-трекер без бэкенда:
 * статус вычисляется от возраста заказа (cutting → gluing → shipping → done).
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../store/auth';
import { useI18n } from '../../lib/i18n';
import { ORDER_STATUS_META, type OrderStatus } from '../../lib/types';
import '../../styles/account.css';

const STEPS: OrderStatus[] = ['cutting', 'gluing', 'shipping', 'done'];

/** 0–1 мин: cutting, 1–3: gluing, 3–10: shipping, дальше done */
export function liveStatus(createdAt: number, now: number): OrderStatus {
  const min = (now - createdAt) / 60000;
  if (min < 1) return 'cutting';
  if (min < 3) return 'gluing';
  if (min < 10) return 'shipping';
  return 'done';
}

function money(n: number): string {
  return `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

export function OrdersSection() {
  const { t, lt, lang } = useI18n();
  const orders = useAuth((s) => s.orders);
  const [now, setNow] = useState(() => Date.now());

  // тикаем, пока есть «живые» заказы — прогресс ползёт сам
  useEffect(() => {
    if (!orders.some((o) => liveStatus(o.createdAt, Date.now()) !== 'done')) return;
    const id = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(id);
  }, [orders, now]);

  return (
    <section>
      <div className="uf-acc-sec-head">
        <h2 className="stencil">{t('account.orders.title')}</h2>
        <span className="tech-label">{t('account.orders.label')}</span>
      </div>

      {orders.length === 0 ? (
        <div className="panel uf-sec-empty">
          <h3>{t('account.orders.empty.title')}</h3>
          <p>{t('account.orders.empty.text')}</p>
          <Link to="/catalog" className="btn ghost" style={{ marginTop: 18 }}>{t('account.orders.empty.cta')} ▸</Link>
        </div>
      ) : (
        <div className="uf-orders">
          {orders.map((o) => {
            const status = liveStatus(o.createdAt, now);
            const stepIdx = STEPS.indexOf(status);
            return (
              <div className="panel rivets" key={o.id} data-testid="order-card">
                <div className="uf-order-head">
                  <span className="uf-order-id">{o.id}</span>
                  <span className="tech-label">
                    {new Date(o.createdAt).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')}
                  </span>
                  {o.discountPct > 0 && (
                    <span className="tape dark">{t('account.orders.discount', { pct: o.discountPct })}</span>
                  )}
                  <span className="uf-order-total">{t('account.orders.total')}: {money(o.total)}</span>
                </div>
                <div className="uf-order-items">
                  {o.items.map((it) => (
                    <span key={it.productId}>
                      ▸ {lt(it.name)} {t('account.orders.qty', { n: it.qty })} — {money(it.price * it.qty)}
                    </span>
                  ))}
                </div>
                <div className="uf-track">
                  <div className="uf-track-fill" style={{ width: `${(stepIdx / (STEPS.length - 1)) * 75}%` }} />
                  {STEPS.map((s, i) => (
                    <div key={s} className={`uf-track-step${i < stepIdx ? ' done' : ''}${i === stepIdx ? ' now' : ''}`}>
                      <div className="uf-track-dot" />
                      <span className="lbl">{lt(ORDER_STATUS_META[s])}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
