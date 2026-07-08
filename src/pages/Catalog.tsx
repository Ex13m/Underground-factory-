import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { useCatalog } from '../store/catalog';
import { useAuth } from '../store/auth';
import type { MaterialGrade } from '../lib/types';
import { GRADE_ORDER, GRADE_META } from '../lib/types';
import { Img } from '../lib/media';
import { ProductCard } from '../components/shop/ProductCard';
import { CarPicker } from '../components/shop/CarPicker';
import { CarShowcase } from '../components/shop/CarShowcase';
import { CarModal } from '../components/shop/CarModal';
import { useReveal } from '../components/shop/useReveal';
import '../styles/shop.css';

type SortMode = 'weight' | 'priceAsc' | 'priceDesc' | 'heat';

export function Catalog() {
  const { t, lt } = useI18n();
  const [params, setParams] = useSearchParams();
  const products = useCatalog((s) => s.products);
  const cars = useCatalog((s) => s.cars);
  const garage = useAuth((s) => s.garage);
  const activeCarId = useAuth((s) => s.activeCarId);

  const carId = params.get('car');
  const car = useMemo(() => cars.find((c) => c.id === carId) ?? null, [cars, carId]);

  const bounds = useMemo(() => {
    if (!products.length) return { min: 0, max: 2000 };
    const prices = products.map((p) => p.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [products]);

  const [rarities, setRarities] = useState<MaterialGrade[]>([]);
  const [priceMin, setPriceMin] = useState(() => bounds.min);
  const [priceMax, setPriceMax] = useState(() => bounds.max);
  const [onlyCar, setOnlyCar] = useState(true);
  const [sort, setSort] = useState<SortMode>('weight');
  // тачка, открытая в большой модалке из карусели (null — закрыто)
  const [showcaseCarId, setShowcaseCarId] = useState<string | null>(null);
  const showcaseCar = useMemo(
    () => cars.find((c) => c.id === showcaseCarId) ?? null,
    [cars, showcaseCarId],
  );

  // тачка из гаража юзера — предложение в один клик
  const garageCar = useMemo(() => {
    const active = garage.find((g) => g.id === activeCarId) ?? garage.find((g) => g.modelId);
    return active?.modelId && active.modelId !== carId ? active : null;
  }, [garage, activeCarId, carId]);

  const toggleRarity = (r: MaterialGrade) =>
    setRarities((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  const resetFilters = () => {
    setRarities([]);
    setPriceMin(bounds.min);
    setPriceMax(bounds.max);
    setOnlyCar(true);
    setSort('weight');
    // сброс = чистый каталог: снимаем и фильтр по тачке (?car=…),
    // иначе у тачки без деталей список остаётся пустым
    setParams({});
  };

  const filtered = useMemo(() => {
    const lo = Math.min(priceMin, priceMax);
    const hi = Math.max(priceMin, priceMax);
    const list = products.filter((p) => {
      if (rarities.length && !rarities.includes(p.rarity)) return false;
      if (p.price < lo || p.price > hi) return false;
      if (car && onlyCar && !p.fits.includes(car.id)) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      switch (sort) {
        case 'priceAsc':
          return a.price - b.price;
        case 'priceDesc':
          return b.price - a.price;
        case 'heat':
          return b.heatC - a.heatC;
        default:
          return a.weightGrams - b.weightGrams;
      }
    });
  }, [products, rarities, priceMin, priceMax, car, onlyCar, sort]);

  const gridRef = useReveal<HTMLDivElement>([filtered.length, carId]);

  return (
    <div className="page" ref={gridRef}>
      <div className="container cat-head">
        <span className="tape">{t('catalog.tape')}</span>
        <h1 className="stencil shop-section-title" style={{ marginTop: 12 }}>
          <span className="glitch auto" data-text={t('catalog.title')}>
            {t('catalog.title')}
          </span>
        </h1>
        <p className="shop-section-sub" style={{ marginTop: 8 }}>
          {t('catalog.sub')}
        </p>

        {/* ============ CAR SHOWCASE (бренды + карусель тачек) ============ */}
        {/* 1 клик = фильтр каталога по тачке, 2 клика = большая модалка */}
        <CarShowcase
          onOpen={setShowcaseCarId}
          onFilter={(id) => setParams({ car: id })}
          activeCarId={carId}
        />

        {/* ============ CAR-FIRST BAR ============ */}
        <div className="cat-carbar">
          <div className="cat-carbar-grid">
            <div className="panel rivets cat-car-panel">
              {car ? (
                <>
                  <Img src={car.img} seed={`car-${car.id}`} alt={`${car.make} ${car.model}`} />
                  <div>
                    <span className="tape">{t('catalog.car.badge')}</span>
                    <div className="cat-car-name">
                      <span className="glitch auto" data-text={`${car.make} ${car.model}`}>
                        {car.make} {car.model}
                      </span>
                    </div>
                    <div className="cat-car-years">
                      {car.years} // {t('catalog.car.smart')}
                    </div>
                    <button
                      type="button"
                      className="cat-garage-chip"
                      onClick={() => setParams({})}
                    >
                      {t('catalog.car.reset')}
                    </button>
                  </div>
                </>
              ) : (
                <div>
                  <span className="tape dark">{t('catalog.car.none.title')}</span>
                  <p className="shop-section-sub" style={{ margin: '10px 0 0' }}>
                    {t('catalog.car.none.sub')}
                  </p>
                  {garageCar && (
                    <button
                      type="button"
                      className="cat-garage-chip"
                      onClick={() => setParams({ car: garageCar.modelId! })}
                    >
                      🏁 {t('catalog.garage.chip', { car: `${garageCar.make} ${garageCar.model}` })}
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="panel cat-car-panel" style={{ display: 'block' }}>
              <CarPicker
                key={carId ?? 'none'}
                initialCarId={carId}
                onPick={(id) => setParams({ car: id })}
              />
              {car && garageCar && (
                <button
                  type="button"
                  className="cat-garage-chip"
                  onClick={() => setParams({ car: garageCar.modelId! })}
                >
                  🏁 {t('catalog.garage.chip', { car: `${garageCar.make} ${garageCar.model}` })}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============ FILTERS + GRID ============ */}
      <div className="container cat-layout">
        <aside className="panel rivets cat-filters">
          <span className="tech-label">{t('catalog.filters.title')}</span>

          <div className="cat-filter-group">
            <span className="tech-label">{t('catalog.filters.rarity')}</span>
            <div className="rarity-chips">
              {GRADE_ORDER.map((r) => {
                const meta = GRADE_META[r];
                const active = rarities.includes(r);
                return (
                  <button
                    key={r}
                    type="button"
                    className={`rarity rarity-chip${active ? ' active' : ''}${meta.glow && active ? ' glow' : ''}`}
                    style={{ color: meta.color }}
                    onClick={() => toggleRarity(r)}
                  >
                    {lt(meta.label)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="cat-filter-group">
            <span className="tech-label">
              {t('catalog.filters.price', { cur: t('common.currency') })}
            </span>
            <div className="range-row">
              <span>{Math.min(priceMin, priceMax)}</span>
              <input
                type="range"
                min={bounds.min}
                max={bounds.max}
                value={priceMin}
                onChange={(e) => setPriceMin(Number(e.target.value))}
              />
            </div>
            <div className="range-row">
              <span>{Math.max(priceMin, priceMax)}</span>
              <input
                type="range"
                min={bounds.min}
                max={bounds.max}
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
              />
            </div>
          </div>

          {car && (
            <label className={`check-decal${onlyCar ? ' on' : ''}`}>
              <input
                type="checkbox"
                checked={onlyCar}
                onChange={(e) => setOnlyCar(e.target.checked)}
              />
              {t('catalog.filters.onlyCar')}
            </label>
          )}

          <div className="cat-filter-group">
            <span className="tech-label">{t('catalog.filters.sort')}</span>
            <select className="field" value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
              <option value="weight">{t('catalog.sort.weight')}</option>
              <option value="priceAsc">{t('catalog.sort.priceAsc')}</option>
              <option value="priceDesc">{t('catalog.sort.priceDesc')}</option>
              <option value="heat">{t('catalog.sort.heat')}</option>
            </select>
          </div>

          <button type="button" className="btn ghost" onClick={resetFilters}>
            {t('catalog.filters.reset')}
          </button>
        </aside>

        <div>
          <div className="cat-found">{t('catalog.found', { n: filtered.length })}</div>

          {filtered.length ? (
            <div className="pgrid">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="panel rivets cat-empty">
              <span className="tape hazard">FATAL // EMPTY STOCK</span>
              <h2 className="stencil">{t('catalog.empty.title')}</h2>
              <p className="shop-section-sub" style={{ margin: '14px auto 26px' }}>
                {t('catalog.empty.text')}
              </p>
              <button type="button" className="btn" onClick={resetFilters}>
                {t('catalog.empty.reset')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============ CAR MODAL ============ */}
      {showcaseCar && (
        <CarModal
          car={showcaseCar}
          onClose={() => setShowcaseCarId(null)}
          onPickInCatalog={(id) => setParams({ car: id })}
        />
      )}
    </div>
  );
}
