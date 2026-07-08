/**
 * PHASE—02 // PAYMENT — checkout-заглушка в стиле Stripe.
 * Реальных платежей нет: маска карты, бренд-детект, 2-сек процессинг,
 * создание Order → addOrder → clear → bus 'checkout:success'.
 */
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart, cartTotals } from '../store/cart';
import { useAuth } from '../store/auth';
import { useCatalog } from '../store/catalog';
import { useI18n } from '../lib/i18n';
import { bus } from '../lib/bus';
import { Img } from '../lib/media';
import type { Order } from '../lib/types';
import { money } from './Cart';
import '../styles/account.css';

type Phase = 'form' | 'processing' | 'success';
type Brand = 'visa' | 'mc' | null;

const digits = (s: string) => s.replace(/\D/g, '');
const maskCard = (s: string) => digits(s).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
const maskExp = (s: string) => {
  const d = digits(s).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};
const detectBrand = (s: string): Brand => {
  const d = digits(s);
  if (d.startsWith('4')) return 'visa';
  if (d.startsWith('5')) return 'mc';
  return null;
};

function BrandBadge({ brand }: { brand: Brand }) {
  const { t } = useI18n();
  if (!brand) return null;
  return (
    <span
      className="tape uf-co-brand"
      style={brand === 'visa' ? { background: '#1a1f71' } : { background: '#eb001b' }}
    >
      {t(brand === 'visa' ? 'cart.checkout.brand.visa' : 'cart.checkout.brand.mc')}
    </span>
  );
}

/** конфетти из карбоновых чешуек */
function CarbonConfetti() {
  const pieces = useMemo(() => {
    const colors = ['#2a2a2e', '#3c3c42', '#8e979e', '#e01b22', '#eceae5'];
    return Array.from({ length: 26 }, (_, i) => ({
      left: `${(i * 137.5) % 100}%`,
      background: colors[i % colors.length],
      animationDuration: `${2.4 + ((i * 7) % 10) / 4}s`,
      animationDelay: `${((i * 13) % 20) / 10}s`,
      width: `${10 + ((i * 5) % 12)}px`,
      height: `${6 + ((i * 3) % 6)}px`,
    }));
  }, []);
  return (
    <div className="uf-confetti" aria-hidden>
      {pieces.map((s, i) => <i key={i} style={s} />)}
    </div>
  );
}

export function Checkout() {
  const { t, lt, lang } = useI18n();
  const navigate = useNavigate();
  const items = useCart((s) => s.items);
  const promoCode = useCart((s) => s.promoCode);
  const clearCart = useCart((s) => s.clear);
  const addOrder = useAuth((s) => s.addOrder);
  const products = useCatalog((s) => s.products);

  const [phase, setPhase] = useState<Phase>('form');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [card, setCard] = useState('');
  const [exp, setExp] = useState('');
  const [cvc, setCvc] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logStep, setLogStep] = useState(0);
  const [done, setDone] = useState<{ id: string; total: number } | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const { subtotal, total, discountPct } = cartTotals();
  const rows = items.flatMap((i) => {
    const product = products.find((p) => p.id === i.productId);
    return product ? [{ item: i, product }] : [];
  });
  const weight = rows.reduce((g, r) => g + r.product.weightGrams * r.item.qty, 0);
  const brand = detectBrand(card);

  // пустая корзина без успеха → назад в корзину
  useEffect(() => {
    if (phase === 'form' && items.length === 0) navigate('/cart', { replace: true });
  }, [phase, items.length, navigate]);

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = t('cart.checkout.err.email');
    if (name.trim().length < 2) e.name = t('cart.checkout.err.name');
    if (digits(card).length !== 16) e.card = t('cart.checkout.err.card');
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp)) e.exp = t('cart.checkout.err.exp');
    if (digits(cvc).length < 3) e.cvc = t('cart.checkout.err.cvc');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    if (phase !== 'form' || !validate()) return;

    setPhase('processing');
    setLogStep(1);
    timersRef.current.push(setTimeout(() => setLogStep(2), 800));
    timersRef.current.push(setTimeout(() => setLogStep(3), 1500));
    timersRef.current.push(
      setTimeout(() => {
        const order: Order = {
          id: 'UF-' + Date.now().toString(36).toUpperCase(),
          items: rows.map(({ item, product }) => ({
            productId: product.id,
            qty: item.qty,
            price: product.price,
            name: product.name,
          })),
          subtotal,
          discountPct,
          promo: promoCode,
          total,
          createdAt: Date.now(),
          status: 'cutting',
        };
        addOrder(order);
        clearCart();
        bus.emit('checkout:success', { orderId: order.id, total: order.total });
        setDone({ id: order.id, total: order.total });
        setPhase('success');
      }, 2000),
    );
  };

  if (phase === 'success' && done) {
    return (
      <div className="page container">
        <div className="panel rivets uf-co-success" style={{ marginTop: 42 }}>
          <CarbonConfetti />
          <span className="tape">{t('cart.checkout.success.tape')}</span>
          <h1 className="stencil glitch" data-text={t('cart.checkout.success.title')}>
            {t('cart.checkout.success.title')}
          </h1>
          <p style={{ color: 'var(--paper-dim)' }}>{t('cart.checkout.success.text')}</p>
          <div className="uf-co-orderid" data-testid="order-id">{done.id}</div>
          <div className="barcode" style={{ margin: '0 auto 26px' }} aria-hidden />
          <div className="uf-co-success-actions">
            <Link to="/account" className="btn">{t('cart.checkout.success.account')}</Link>
            <Link to="/catalog" className="btn ghost">{t('cart.checkout.success.more')}</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page container">
      <div className="uf-page-head">
        <span className="tech-label">{t('cart.checkout.phase')}</span>
        <h1 className="stencil">
          <span className="glitch auto" data-text={t('cart.checkout.title')}>{t('cart.checkout.title')}</span>
        </h1>
        <span className="tech-label">{t('cart.checkout.secure')}</span>
      </div>

      <div className="uf-co-grid">
        {phase === 'processing' ? (
          <div className="uf-co-console" data-testid="processing" aria-live="polite">
            {logStep >= 1 && <div className="line">{t('cart.checkout.log1')}</div>}
            {logStep >= 2 && <div className="line" style={{ animationDelay: '0.05s' }}>{t('cart.checkout.log2')}</div>}
            {logStep >= 3 && <div className="line ok" style={{ animationDelay: '0.05s' }}>{t('cart.checkout.log3')}</div>}
            <div style={{ marginTop: 10 }}><span className="uf-co-cursor" /></div>
            <div className="tech-label" style={{ marginTop: 18 }}>{t('cart.checkout.processing')}</div>
          </div>
        ) : (
          <form className="panel rivets uf-co-form" onSubmit={submit} noValidate>
            <div className="uf-co-field">
              <label className="tech-label" htmlFor="co-email">{t('cart.checkout.email')}</label>
              <input
                id="co-email" className={`field${errors.email ? ' invalid' : ''}`} type="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder={t('cart.checkout.emailPh')} autoComplete="email"
              />
              {errors.email && <span className="uf-co-err">{errors.email}</span>}
            </div>

            <div className="uf-co-field">
              <label className="tech-label" htmlFor="co-name">{t('cart.checkout.name')}</label>
              <input
                id="co-name" className={`field${errors.name ? ' invalid' : ''}`}
                value={name} onChange={(e) => setName(e.target.value.toUpperCase())}
                placeholder={t('cart.checkout.namePh')} autoComplete="cc-name"
              />
              {errors.name && <span className="uf-co-err">{errors.name}</span>}
            </div>

            <div className="uf-co-field">
              <label className="tech-label" htmlFor="co-card">{t('cart.checkout.card')}</label>
              <div className="uf-co-cardwrap">
                <input
                  id="co-card" className={`field${errors.card ? ' invalid' : ''}`} inputMode="numeric"
                  value={card} onChange={(e) => setCard(maskCard(e.target.value))}
                  placeholder={t('cart.checkout.cardPh')} autoComplete="cc-number"
                  style={{ paddingRight: brand ? 110 : undefined }}
                />
                <BrandBadge brand={brand} />
              </div>
              {errors.card && <span className="uf-co-err">{errors.card}</span>}
            </div>

            <div className="uf-co-row2">
              <div className="uf-co-field">
                <label className="tech-label" htmlFor="co-exp">{t('cart.checkout.exp')}</label>
                <input
                  id="co-exp" className={`field${errors.exp ? ' invalid' : ''}`} inputMode="numeric"
                  value={exp} onChange={(e) => setExp(maskExp(e.target.value))}
                  placeholder="12/29" autoComplete="cc-exp"
                />
                {errors.exp && <span className="uf-co-err">{errors.exp}</span>}
              </div>
              <div className="uf-co-field">
                <label className="tech-label" htmlFor="co-cvc">{t('cart.checkout.cvc')}</label>
                <input
                  id="co-cvc" className={`field${errors.cvc ? ' invalid' : ''}`} inputMode="numeric" type="password"
                  value={cvc} onChange={(e) => setCvc(digits(e.target.value).slice(0, 4))}
                  placeholder="•••" autoComplete="cc-csc"
                />
                {errors.cvc && <span className="uf-co-err">{errors.cvc}</span>}
              </div>
            </div>

            <button className="btn uf-co-pay" type="submit" data-testid="pay">
              {t('cart.checkout.pay', { sum: money(total) })}
            </button>
            <div className="tech-label" style={{ textAlign: 'center' }}>{t('cart.checkout.demo')}</div>
          </form>
        )}

        <aside className="panel rivets uf-summary">
          <span className="tech-label">{t('cart.checkout.summary')}</span>
          <div className="uf-co-items">
            {rows.map(({ item, product: p }) => (
              <div className="uf-co-item" key={p.id}>
                <Img src={p.media[0]?.url} seed={p.media[0]?.seed ?? p.id} alt={lt(p.name)} />
                <div>
                  <div className="nm">{lt(p.name)}</div>
                  <span className="tech-label">{p.sku} × {item.qty}</span>
                </div>
                <span className="mono" style={{ fontSize: 13 }}>{money(p.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="uf-summary-rows">
            <div className="uf-summary-row">
              <span>{t('cart.weight.label')}</span>
              <span>{t('cart.weight.value', { n: weight.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US') })}</span>
            </div>
            <div className="uf-summary-row">
              <span>{t('cart.subtotal')}</span>
              <span>{money(subtotal)}</span>
            </div>
            {discountPct > 0 && (
              <div className="uf-summary-row discount">
                <span>{t('cart.discount')} −{discountPct}%{promoCode ? ` (${promoCode})` : ''}</span>
                <span>−{money(subtotal - total)}</span>
              </div>
            )}
            <div className="uf-summary-row total">
              <span>{t('cart.total')}</span>
              <span>{money(total)}</span>
            </div>
          </div>
          <div className="hazard-stripe" aria-hidden />
        </aside>
      </div>
    </div>
  );
}
