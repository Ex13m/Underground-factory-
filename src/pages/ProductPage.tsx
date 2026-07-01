import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { useCatalog } from '../store/catalog';
import { useCart } from '../store/cart';
import { useAuth } from '../store/auth';
import { bus } from '../lib/bus';
import { Img } from '../lib/media';
import { GRADE_META } from '../lib/types';
import { ProductCard } from '../components/shop/ProductCard';
import { useReveal } from '../components/shop/useReveal';
import '../styles/shop.css';

export function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lt } = useI18n();
  const products = useCatalog((s) => s.products);
  const cars = useCatalog((s) => s.cars);
  const add = useCart((s) => s.add);
  const favorites = useAuth((s) => s.favorites);
  const toggleFavorite = useAuth((s) => s.toggleFavorite);
  const garage = useAuth((s) => s.garage);
  const activeCarId = useAuth((s) => s.activeCarId);

  const product = useMemo(() => products.find((p) => p.id === id), [products, id]);

  const [mediaIdx, setMediaIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const pageRef = useReveal<HTMLDivElement>([id]);

  // сброс локального состояния при переходе на другой товар
  useEffect(() => {
    setMediaIdx(0);
    setQty(1);
    setAdded(false);
  }, [id]);

  // сигналы боту: просмотр + «залип» через ~12 сек
  useEffect(() => {
    if (!product) return;
    bus.emit('product:view', { productId: product.id });
    const timer = window.setTimeout(
      () => bus.emit('product:linger', { productId: product.id }),
      12000,
    );
    return () => window.clearTimeout(timer);
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!product) {
    return (
      <div className="page container cat-empty">
        <span className="tape hazard">FATAL ERROR</span>
        <h1 className="stencil" style={{ color: 'var(--blood)' }}>
          {t('product.notfound.title')}
        </h1>
        <p className="shop-section-sub" style={{ margin: '14px auto 28px' }}>
          {t('product.notfound.text')}
        </p>
        <Link to="/catalog" className="btn">
          {t('product.notfound.back')} ▸
        </Link>
      </div>
    );
  }

  const meta = RARITY_META[product.rarity];
  const media = product.media[mediaIdx] ?? product.media[0];
  const fav = favorites.includes(product.id);

  const fitCars = product.fits
    .map((fid) => cars.find((c) => c.id === fid))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const activeGarageCar = garage.find((g) => g.id === activeCarId);
  const fitVerdict: 'yes' | 'no' | null = activeGarageCar?.modelId
    ? product.fits.includes(activeGarageCar.modelId)
      ? 'yes'
      : 'no'
    : null;

  const similar = products
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.rarity === product.rarity || p.fits.some((f) => product.fits.includes(f))),
    )
    .slice(0, 4);

  const onAdd = () => {
    add(product.id, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="page container" ref={pageRef}>
      <div className="pp-layout">
        {/* ============ GALLERY ============ */}
        <div className="pp-gallery">
          <div className="pp-main-img">
            <Img
              src={media?.url}
              seed={media?.seed ?? `pp-${product.id}-${mediaIdx}`}
              alt={lt(product.name)}
            />
            <div className="pp-hud" aria-hidden>
              <span className="hud-corner c1" />
              <span className="hud-corner c2" />
              <span className="hud-tl">{product.sku}</span>
              <span className="hud-tr">{t('product.hud.qc')}</span>
              <span className="hud-bl">{t('product.hud.coords')}</span>
            </div>
          </div>
          {product.media.length > 1 && (
            <div className="pp-thumbs">
              {product.media.map((m, i) => (
                <button
                  key={`${m.url}-${i}`}
                  type="button"
                  className={`pp-thumb${i === mediaIdx ? ' active' : ''}`}
                  onClick={() => setMediaIdx(i)}
                >
                  <Img src={m.url} seed={m.seed ?? `pp-${product.id}-${i}`} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ============ INFO ============ */}
        <div className="pp-info">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <span
              className={`rarity${meta.glow ? ' glow' : ''}`}
              style={{ color: meta.color }}
            >
              {lt(meta.label)}
            </span>
            <span className="tech-label">{product.sku}</span>
            <button
              type="button"
              className={`pcard-fav${fav ? ' on' : ''}`}
              style={{ position: 'static', marginLeft: 'auto' }}
              onClick={() => toggleFavorite(product.id)}
              aria-label={t(fav ? 'catalog.card.unfav' : 'catalog.card.fav')}
            >
              ♥
            </button>
          </div>

          <h1 className="stencil pp-title glitch" data-text={lt(product.name)}>
            {lt(product.name)}
          </h1>
          <div className="pp-price">
            {t('common.currency')}
            {product.price}
          </div>
          <p className="pp-desc">{lt(product.desc)}</p>

          {/* spec table */}
          <div className="panel rivets pp-spec">
            <div className="pp-spec-row">
              <span className="tech-label">{t('product.spec.title')}</span>
              <span className="barcode" aria-hidden />
            </div>
            <div className="pp-spec-row">
              <span className="tech-label">{t('product.spec.weight')}</span>
              <span className="pp-spec-weight mono">
                {product.weightGrams}
                <small> {t('common.grams')}</small>
              </span>
            </div>
            <div className="pp-spec-row">
              <span className="tech-label">{t('product.spec.rain')}</span>
              <span className="mono">
                {product.rainMinutes === -1
                  ? t('product.spec.rain.inf')
                  : t('product.spec.rain.min', { n: product.rainMinutes })}
              </span>
            </div>
            <div className="pp-spec-row">
              <span className="tech-label">{t('product.spec.material')}</span>
              <span className="mono">{lt(product.material)}</span>
            </div>
            <div className="pp-spec-row">
              <span className="tech-label">{t('product.spec.crash')}</span>
              <span className="mono pp-spec-pass">▸ {t('product.spec.crash.val')}</span>
            </div>
          </div>

          {/* compatibility */}
          <div>
            <span className="tech-label" style={{ display: 'block', marginBottom: 9 }}>
              {t('product.fits.title')}
            </span>
            <div className="pp-fits">
              {fitCars.map((c) => (
                <Link key={c.id} to={`/catalog?car=${c.id}`} className="pp-fit-chip">
                  {c.make} {c.model}
                </Link>
              ))}
            </div>
            {fitVerdict && (
              <div className={`pp-fit-verdict ${fitVerdict}`} style={{ marginTop: 10 }}>
                {t(fitVerdict === 'yes' ? 'product.fits.yes' : 'product.fits.no')}
              </div>
            )}
          </div>

          {/* buy */}
          <div className="pp-buy">
            <div className="pp-qty" aria-label={t('product.qty')}>
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                −
              </button>
              <span className="mono">{qty}</span>
              <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))}>
                +
              </button>
            </div>
            <button type="button" className="btn" onClick={onAdd}>
              {added ? t('product.added') : `${t('product.add')} ▸`}
            </button>
          </div>

          {/* bot teaser (декор, бот живёт отдельно) */}
          <div className="pp-bot-teaser">
            <span className="bot-face jp" aria-hidden>
              紙
            </span>
            <span>{t('product.bot.teaser')}</span>
          </div>
        </div>
      </div>

      {/* ============ SIMILAR ============ */}
      {similar.length > 0 && (
        <section className="pp-similar">
          <div className="shop-section-head">
            <span className="tape">{t('product.similar.tape')}</span>
            <h2 className="stencil shop-section-title">{t('product.similar.title')}</h2>
          </div>
          <div className="pgrid">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
