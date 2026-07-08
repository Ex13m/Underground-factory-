/**
 * PHASE—01 // CARGO BAY — корзина.
 * Позиции, степперы, промокод, fun-метрика веса, cart:abandon при уходе.
 */
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart, cartTotals } from '../store/cart';
import { useCatalog } from '../store/catalog';
import { useI18n } from '../lib/i18n';
import { bus } from '../lib/bus';
import { Img } from '../lib/media';
import '../styles/account.css';

function fmtInt(n: number, lang: string) {
  return n.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US');
}

export function money(n: number): string {
  return `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

export function Cart() {
  const { t, lt, lang } = useI18n();
  const navigate = useNavigate();
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const applyPromo = useCart((s) => s.applyPromo);
  const clearPromo = useCart((s) => s.clearPromo);
  const promoCode = useCart((s) => s.promoCode);
  const discountPct = useCart((s) => s.discountPct);
  const products = useCatalog((s) => s.products);

  const [code, setCode] = useState('');
  const [promoErr, setPromoErr] = useState(false);

  const { subtotal, total } = cartTotals();

  const rows = items.flatMap((i) => {
    const product = products.find((p) => p.id === i.productId);
    return product ? [{ item: i, product }] : [];
  });

  const weight = rows.reduce((g, r) => g + r.product.weightGrams * r.item.qty, 0);

  // cart:abandon — уходим со страницы с непустой корзиной (кроме перехода в checkout)
  const stateRef = useRef({ count: items.length, total });
  stateRef.current = { count: items.length, total };
  useEffect(
    () => () => {
      const goingToCheckout = window.location.hash.replace(/^#/, '').startsWith('/checkout');
      if (stateRef.current.count > 0 && !goingToCheckout) {
        bus.emit('cart:abandon', { total: stateRef.current.total });
      }
    },
    [],
  );

  const submitPromo = (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    const ok = applyPromo(code);
    setPromoErr(!ok);
    if (ok) setCode('');
  };

  if (items.length === 0) {
    return (
      <div className="page container">
        <div className="uf-empty">
          <span className="tape">{t('cart.empty.tape')}</span>
          <h1 className="stencil glitch" data-text={t('cart.empty.title')}>{t('cart.empty.title')}</h1>
          <p>{t('cart.empty.text')}</p>
          <div className="barcode" style={{ margin: '0 auto 28px' }} aria-hidden />
          <Link to="/catalog" className="btn">{t('cart.empty.cta')} ▸</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page container">
      <div className="uf-page-head">
        <span className="tech-label">{t('cart.phase')}</span>
        <h1 className="stencil">
          <span className="glitch auto" data-text={t('cart.title')}>{t('cart.title')}</span>
        </h1>
        <span className="tech-label">{t('cart.positions', { n: rows.length })}</span>
      </div>

      <div className="uf-cart-grid">
        <div>
          <div className="uf-cart-list">
            {rows.map(({ item, product: p }) => (
              <div className="panel rivets uf-cart-row" key={p.id} data-testid="cart-row">
                <Link to={`/product/${p.id}`}>
                  <Img src={p.media[0]?.url} seed={p.media[0]?.seed ?? p.id} alt={lt(p.name)} />
                </Link>
                <div>
                  <Link to={`/product/${p.id}`}>
                    <h3 className="stencil uf-cart-row-name">{lt(p.name)}</h3>
                  </Link>
                  <div className="uf-cart-row-meta">
                    <span className="tech-label">{p.sku}</span>
                    <span className="mono" style={{ fontSize: 13 }}>
                      {money(p.price)} <span className="tech-label">{t('cart.each')}</span>
                    </span>
                    <span className="tech-label">{fmtInt(p.weightGrams * item.qty, lang)} {t('common.grams')}</span>
                  </div>
                  <div className="uf-step" style={{ marginTop: 10 }} aria-label={t('cart.qty')}>
                    <button onClick={() => setQty(p.id, item.qty - 1)} aria-label="−">−</button>
                    <span>{item.qty}</span>
                    <button onClick={() => setQty(p.id, item.qty + 1)} aria-label="+">+</button>
                  </div>
                </div>
                <div className="uf-cart-row-right">
                  <button className="uf-x" onClick={() => remove(p.id)} title={t('cart.remove')} aria-label={t('cart.remove')}>✕</button>
                  <span className="uf-cart-line-total">{money(p.price * item.qty)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="panel uf-weight">
            <span className="tech-label">{t('cart.weight.label')}</span>
            <b>{t('cart.weight.value', { n: fmtInt(weight, lang) })}</b>
            <span className="tech-label" style={{ color: 'var(--paper-dim)' }}>// {t('cart.weight.joke')}</span>
          </div>
        </div>

        <aside className="uf-summary">
          <div className="panel rivets">
            <span className="tech-label">{t('cart.promo.title')}</span>
            {promoCode ? (
              <div className="uf-promo-ok" style={{ marginTop: 10 }}>
                <span>{t('cart.promo.applied', { code: promoCode, pct: discountPct })}</span>
                <button onClick={() => clearPromo()}>{t('cart.promo.remove')}</button>
              </div>
            ) : (
              <>
                <form className="uf-promo-form" style={{ marginTop: 10 }} onSubmit={submitPromo}>
                  <input
                    className="field"
                    value={code}
                    onChange={(e) => { setCode(e.target.value); setPromoErr(false); }}
                    placeholder={t('cart.promo.placeholder')}
                    data-testid="promo-input"
                  />
                  <button className="btn dark" type="submit" style={{ padding: '11px 16px', fontSize: 12 }}>
                    {t('cart.promo.apply')}
                  </button>
                </form>
                {promoErr && <div className="uf-promo-err" style={{ marginTop: 8 }}>{t('cart.promo.error')}</div>}
                {!promoErr && <div className="tech-label" style={{ marginTop: 8 }}>{t('cart.promo.hint')}</div>}
              </>
            )}
          </div>

          <div className="panel rivets">
            <span className="tech-label">{t('cart.total')} // QC ▸ PENDING</span>
            <div className="uf-summary-rows">
              <div className="uf-summary-row">
                <span>{t('cart.subtotal')}</span>
                <span>{money(subtotal)}</span>
              </div>
              {discountPct > 0 && (
                <div className="uf-summary-row discount">
                  <span>{t('cart.discount')} −{discountPct}%</span>
                  <span>−{money(subtotal - total)}</span>
                </div>
              )}
              <div className="uf-summary-row total">
                <span>{t('cart.total')}</span>
                <span>{money(total)}</span>
              </div>
            </div>
            <button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/checkout')} data-testid="to-checkout">
              {t('cart.checkout')}
            </button>
            <div className="hazard-stripe" style={{ marginTop: 14 }} aria-hidden />
          </div>
        </aside>
      </div>
    </div>
  );
}
