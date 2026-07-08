/**
 * Вкладка ЦЕХ — дерево «тачка ▸ детали ▸ материал».
 * Привязка идёт от тачки (product.fits), материал детали = product.rarity.
 * Плюс ультрабыстрое создание деталей и загрузка STL (mediaStore, kind='model').
 */

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import { Img } from '../../lib/media';
import { getOverride, onMediaChanged, setOverride } from '../../lib/mediaStore';
import { GRADE_META, GRADE_ORDER } from '../../lib/types';
import type { CarModel, LocalText, MaterialGrade, Product } from '../../lib/types';
import { useCatalog } from '../../store/catalog';
import { makeId, posNum } from './util';

/** SKU по паттерну ProductForm.nextCustomSku (там она не экспортируется). */
function nextCustomSku(): string {
  const n = api.listProducts().filter((p) => p.custom).length + 1;
  return `UF-CST/${String(n).padStart(2, '0')}`;
}

/** Автозаполнение быстрой карточки по материалу: вес, термостойкость, спецификация. */
const QUICK_DEFAULTS: Record<MaterialGrade, { weightGrams: number; heatC: number; material: LocalText }> = {
  carbon: {
    weightGrams: 2000,
    heatC: 220,
    material: { ru: 'Карбон 2×2 твил, автоклав', en: '2×2 twill carbon, autoclave-cured' },
  },
  composite: {
    weightGrams: 3200,
    heatC: 140,
    material: { ru: 'Стеклокомпозит ручной укладки', en: 'Hand-laid fibreglass composite' },
  },
  abs: {
    weightGrams: 1500,
    heatC: 90,
    material: { ru: 'АБС + грунт под покраску', en: 'ABS + paint-ready primer' },
  },
};

/** Перерисовка при изменениях mediaStore (появление/замена STL). */
function useMediaVersion() {
  const [, bump] = useState(0);
  useEffect(() => onMediaChanged(() => bump((n) => n + 1)), []);
}

export function TreeTab() {
  const { t } = useI18n();
  useMediaVersion();
  const cars = useCatalog((s) => s.cars);
  const products = useCatalog((s) => s.products);

  return (
    <div className="adm-section">
      <div className="panel">
        <div className="adm-block-title">
          <h2 className="stencil">{t('admin.tree.title')}</h2>
        </div>
        <p className="adm-note">{t('admin.tree.note')}</p>
        <div className="adm-tree">
          {cars.map((c) => (
            <CarNode key={c.id} car={c} products={products} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- узел тачки ---------- */

function CarNode({ car, products }: { car: CarModel; products: Product[] }) {
  const { t, lt } = useI18n();
  const [open, setOpen] = useState(false);
  const [attachId, setAttachId] = useState('');

  const parts = products.filter((p) => p.fits.includes(car.id));
  const loose = products.filter((p) => !p.fits.includes(car.id));

  const attach = () => {
    const p = products.find((x) => x.id === attachId);
    if (!p) return;
    api.updateProduct(p.id, { fits: [...p.fits, car.id] });
    setAttachId('');
  };

  return (
    <div className={`adm-tree-node${open ? ' open' : ''}`}>
      <button type="button" className="adm-tree-head" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Img className="adm-thumb" src={car.img} seed={`car-${car.id}`} alt={`${car.make} ${car.model}`} />
        <span className="adm-tree-car">
          {car.make} {car.model}
          <span className="adm-tree-years">{car.years}</span>
        </span>
        <span className="tech-label">{t('admin.tree.parts', { n: parts.length })}</span>
        <span className="adm-tree-chevron" aria-hidden>
          {open ? '▾' : '▸'}
        </span>
      </button>

      {open && (
        <div className="adm-tree-body">
          {parts.length === 0 ? (
            <div className="adm-empty">{t('admin.tree.empty')}</div>
          ) : (
            parts.map((p) => <PartRow key={p.id} car={car} p={p} />)
          )}

          <div className="adm-tree-attach">
            <select className="field" value={attachId} onChange={(e) => setAttachId(e.target.value)}>
              <option value="">{t('admin.tree.attachPh')}</option>
              {loose.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {lt(p.name)}
                </option>
              ))}
            </select>
            <button type="button" className="adm-mini-btn" disabled={!attachId} onClick={attach}>
              {t('admin.tree.attach')}
            </button>
          </div>

          <QuickForm car={car} />
        </div>
      )}
    </div>
  );
}

/* ---------- строка детали ---------- */

function PartRow({ car, p }: { car: CarModel; p: Product }) {
  const { t, lt } = useI18n();
  const meta = GRADE_META[p.rarity];
  const stl = getOverride(`${p.id}-stl`);

  const unlink = () => api.updateProduct(p.id, { fits: p.fits.filter((id) => id !== car.id) });

  const onStl = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void setOverride(`${p.id}-stl`, 'model', file, { prompt: file.name });
    e.target.value = ''; // повторный выбор того же файла тоже сработает
  };

  return (
    <div className="adm-tree-part">
      <Img className="adm-thumb" src={p.media[0]?.url} seed={p.media[0]?.seed ?? p.id} alt={lt(p.name)} />
      <span className="adm-tree-sku">{p.sku}</span>
      <span className="adm-tree-main">
        <span className="adm-tree-name">{lt(p.name)}</span>
        <span className={`adm-tree-grade${meta.glow ? ' glow' : ''}`} style={{ color: meta.color }}>
          {lt(meta.label)}
        </span>
        {stl && <span className="adm-badge">STL</span>}
      </span>
      <span className="adm-num">
        {t('common.currency')}
        {p.price}
      </span>
      <div className="adm-actions">
        <label className="adm-mini-btn">
          {stl ? t('admin.tree.stlHave') : t('admin.tree.stl')}
          <input type="file" accept=".stl" hidden onChange={onStl} />
        </label>
        <button type="button" className="adm-mini-btn danger" onClick={unlink}>
          {t('admin.tree.unlink')}
        </button>
      </div>
    </div>
  );
}

/* ---------- ультрабыстрое создание детали ---------- */

function QuickForm({ car }: { car: CarModel }) {
  const { t, lt } = useI18n();
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<MaterialGrade>('carbon');
  const [price, setPrice] = useState('');
  const [errs, setErrs] = useState<{ name?: boolean; price?: boolean }>({});
  const [flash, setFlash] = useState('');

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    const bad = { name: !name.trim(), price: Number.isNaN(posNum(price)) };
    setErrs(bad);
    if (bad.name || bad.price) return;

    const nm = name.trim();
    const d = QUICK_DEFAULTS[grade];
    const sku = nextCustomSku();
    api.addProduct({
      // makeId уже добавляет Date.now().toString(36) — id уникален
      id: makeId(nm),
      sku,
      name: { ru: nm, en: nm },
      desc: {
        ru: `${nm} для ${car.make} ${car.model}. Быстрая карточка — уточните описание позже.`,
        en: `${nm} for ${car.make} ${car.model}. Quick card — refine the description later.`,
      },
      price: posNum(price),
      weightGrams: d.weightGrams,
      heatC: d.heatC,
      rarity: grade,
      material: d.material,
      fits: [car.id],
      media: [], // fallback-арт нарисуется сам (Img по seed=id)
    });

    setName('');
    setPrice('');
    setErrs({});
    setFlash(t('admin.tree.quickDone', { sku }));
    window.setTimeout(() => setFlash(''), 2600);
  };

  return (
    <form className="adm-quick" onSubmit={create} noValidate>
      <span className="tape">{t('admin.tree.quick')}</span>
      <div className="adm-quick-row">
        <div className="adm-fld">
          <label htmlFor={`qk-name-${car.id}`}>{t('admin.tree.quickName')}</label>
          <input
            id={`qk-name-${car.id}`}
            className={`field${errs.name ? ' invalid' : ''}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="adm-fld">
          <label htmlFor={`qk-grade-${car.id}`}>{t('admin.f.rarity')}</label>
          <select
            id={`qk-grade-${car.id}`}
            className="field"
            value={grade}
            onChange={(e) => setGrade(e.target.value as MaterialGrade)}
          >
            {GRADE_ORDER.map((g) => (
              <option key={g} value={g}>
                {lt(GRADE_META[g].label)}
              </option>
            ))}
          </select>
        </div>
        <div className="adm-fld">
          <label htmlFor={`qk-price-${car.id}`}>{t('admin.f.price')}</label>
          <input
            id={`qk-price-${car.id}`}
            className={`field${errs.price ? ' invalid' : ''}`}
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <button type="submit" className="btn">
          ⚡ {t('admin.tree.quickCreate')}
        </button>
      </div>
      {flash && <span className="adm-flash">{flash}</span>}
    </form>
  );
}
