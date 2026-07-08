import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { useCatalog } from '../store/catalog';
import { useUI } from '../store/ui';
import { VideoBg } from '../lib/media';
import { HERO_VIDEOS } from '../data/seed';
import { GRADE_ORDER, GRADE_META } from '../lib/types';
import { ProductCard } from '../components/shop/ProductCard';
import { CarPicker } from '../components/shop/CarPicker';
import { useReveal } from '../components/shop/useReveal';
import '../styles/shop.css';

/** Бегущий счётчик: анимирует число при появлении во вьюпорте. */
function Counter({ value, label, suffix }: { value: number; label: string; suffix?: string }) {
  const calm = useUI((s) => s.calm);
  const ref = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(calm ? value : 0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (calm) {
      setN(value);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        const start = performance.now();
        const dur = 1700;
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / dur);
          const ease = 1 - Math.pow(1 - p, 3);
          setN(Math.round(value * ease));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, calm]);

  return (
    <div className="counter-cell" ref={ref}>
      <div className="counter-num">
        {n.toLocaleString('en-US').replace(/,/g, ' ')}
        {suffix && <span className="suffix">{suffix}</span>}
      </div>
      <div className="counter-label tech-label">{label}</div>
    </div>
  );
}

const STEP_GLYPHS = ['型', '積', '窯', '走'];

export function Home() {
  const { t, lt } = useI18n();
  const navigate = useNavigate();
  const products = useCatalog((s) => s.products);
  const pageRef = useReveal<HTMLDivElement>([products.length]);

  const hits = useMemo(() => products.filter((p) => p.hit), [products]);
  const lightest = useMemo(
    () => (products.length ? Math.min(...products.map((p) => p.weightGrams)) : 0),
    [products],
  );
  const maxHeat = useMemo(
    () => products.reduce((m, p) => (p.heatC > m ? p.heatC : m), 0),
    [products],
  );

  return (
    <div className="page" ref={pageRef}>
      {/* ============ HERO ============ */}
      <section className="uf-hero">
        <VideoBg sources={HERO_VIDEOS} seed="hero" />
        <div className="uf-hero-overlay" aria-hidden />

        {/* stitch HUD: уголки, координаты, статус системы */}
        <div className="hud-corner tl" aria-hidden />
        <div className="hud-corner br" aria-hidden style={{ right: 80 }} />
        <div className="uf-hero-coords" aria-hidden>COORD: 55.7558° N // 37.6173° E</div>
        <div className="container">
          <div className="uf-hero-status" aria-hidden>
            <span className="row"><span className="status-dot" /> SYSTEM ▸ ONLINE</span>
            <span className="row" style={{ color: 'var(--steel)' }}>ENCRYPTION ▸ AES-256 // UF-042</span>
          </div>
        </div>

        <div className="uf-side-decal" aria-hidden>
          <span className="v-jp jp">軽量</span>
          <span className="v-tech">UF—042 // CARBON DIV.</span>
          <span className="v-jp jp">走れ</span>
        </div>

        <div className="container">
          <div className="uf-hero-content">
            <span className="tape">{t('home.hero.tape')}</span>
            <h1 className="stencil uf-hero-title">
              <span className="glitch auto" data-text={t('home.hero.title')}>
                {t('home.hero.title')}
              </span>
            </h1>
            <p className="uf-hero-sub">{t('home.hero.sub')}</p>
            <Link to="/catalog" className="btn">
              {t('home.hero.cta')} ▸
            </Link>
            <div className="uf-hero-marks">
              <span className="tech-label">{t('home.hero.mark1')}</span>
              <span className="tech-label">{t('home.hero.mark2')}</span>
              <span className="tape dark">{t('home.hero.mark3')}</span>
              <span className="barcode" aria-hidden />
            </div>
          </div>
        </div>
        <div className="uf-hero-scroll mono" aria-hidden>
          {t('home.hero.scroll')} ▾
        </div>
      </section>

      {/* ============ CAR-FIRST PICKER ============ */}
      <section className="home-picker">
        <div className="container">
          <div className="panel rivets home-picker-panel reveal">
            <div className="home-picker-head">
              <span className="tape">{t('home.picker.tape')}</span>
              <h2 className="stencil shop-section-title">{t('home.picker.title')}</h2>
              <p className="shop-section-sub">{t('home.picker.sub')}</p>
            </div>
            <CarPicker
              onPick={(carId) => navigate(`/catalog?car=${carId}`)}
              ctaLabel={t('home.picker.cta')}
            />
          </div>
        </div>
      </section>

      {/* ============ RARITY TIERS ============ */}
      <div className="zig" aria-hidden />
      <section className="inverse">
        <div className="container shop-section">
          <div className="shop-section-head">
            <span className="tape">{t('home.rarity.tape')}</span>
            <h2 className="stencil shop-section-title">{t('home.rarity.title')}</h2>
            <p className="shop-section-sub">{t('home.rarity.sub')}</p>
          </div>
          <div className="tier-grid">
            {GRADE_ORDER.map((r, i) => {
              const meta = GRADE_META[r];
              return (
                <div key={r} className={`tier-card reveal d${Math.min(i, 3)}`}>
                  <div className="tier-bar" style={{ background: meta.color }} aria-hidden />
                  <span className="tier-idx">
                    {t('home.rarity.tier')}—0{i + 1}
                  </span>
                  <span
                    className={`rarity${meta.glow ? ' glow' : ''}`}
                    style={{ color: meta.color }}
                  >
                    {lt(meta.label)}
                  </span>
                  <div className="tier-name">{lt(meta.label)}</div>
                  <p className="tier-desc">{t(`home.rarity.${r}`)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <div className="zig flip" aria-hidden />

      {/* ============ HOW WE BUILD (scroll scene) ============ */}
      <section className="shop-section">
        <div className="container">
          <div className="shop-section-head">
            <span className="tape">{t('home.steps.tape')}</span>
            <h2 className="stencil shop-section-title">{t('home.steps.title')}</h2>
          </div>
          <div className="phase-list">
            {[1, 2, 3, 4].map((n, i) => (
              <div key={n} className={`panel rivets phase-row reveal d${Math.min(i, 3)}`}>
                <div className="phase-num">
                  PHASE—0{n}
                  <b>0{n}</b>
                </div>
                <div>
                  <div className="phase-name">{t(`home.steps.${n}.name`)}</div>
                  <p className="phase-desc">{t(`home.steps.${n}.desc`)}</p>
                </div>
                <div className="phase-glyph jp" aria-hidden>
                  {STEP_GLYPHS[i]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ RED POSTER ============ */}
      <div className="zig red" aria-hidden />
      <section className="red-poster">
        <div className="container red-poster-inner">
          <div className="jp red-poster-glyph reveal" aria-hidden>
            軽量
          </div>
          <div className="stencil red-poster-slogan reveal d1">{t('home.poster.slogan')}</div>
          <div className="red-poster-note">{t('home.poster.note')}</div>
        </div>
      </section>
      <div className="zig red flip" aria-hidden />

      {/* ============ HITS ============ */}
      <section className="shop-section">
        <div className="container">
          <div className="shop-section-head">
            <span className="tape">{t('home.hits.tape')}</span>
            <h2 className="stencil shop-section-title">{t('home.hits.title')}</h2>
            <p className="shop-section-sub">{t('home.hits.sub')}</p>
          </div>
          <div className="pgrid">
            {hits.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ============ REVIEWS ============ */}
      <section className="shop-section">
        <div className="container">
          <div className="shop-section-head">
            <span className="tape dark">{t('home.reviews.tape')}</span>
            <h2 className="stencil shop-section-title">{t('home.reviews.title')}</h2>
          </div>
          <div className="review-grid">
            {[1, 2, 3, 4].map((n, i) => (
              <div key={n} className={`panel inverse review-sticker reveal d${Math.min(i, 3)}`}>
                <div className="review-stars" aria-hidden>
                  ★★★★★
                </div>
                <p className="review-text">«{t(`home.reviews.${n}.text`)}»</p>
                <div className="review-author">— {t(`home.reviews.${n}.name`)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ COUNTERS ============ */}
      <section className="shop-section" style={{ paddingBottom: 0 }}>
        <div className="container">
          <div className="hazard-stripe" aria-hidden />
          <div className="counters">
            <Counter value={lightest} suffix={t('common.grams')} label={t('home.counters.weight')} />
            <Counter value={maxHeat} suffix="°C" label={t('home.counters.heat')} />
            <Counter value={1387} suffix="+" label={t('home.counters.racers')} />
          </div>
          <div className="hazard-stripe" aria-hidden />
        </div>
      </section>
    </div>
  );
}
