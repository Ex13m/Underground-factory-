/** Форма добавления/правки обвеса. .panel.rivets, красные подсказки, живые превью. */

import { useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import { Img } from '../../lib/media';
import { GRADE_META, GRADE_ORDER } from '../../lib/types';
import type { CarModel, MaterialGrade, MediaItem, Product } from '../../lib/types';
import { makeId, posNum } from './util';

interface MediaRow {
  type: 'image' | 'video';
  url: string;
}

interface Props {
  cars: CarModel[];
  /** null → режим добавления */
  initial: Product | null;
  onDone: () => void;
}

function nextCustomSku(): string {
  const n = api.listProducts().filter((p) => p.custom).length + 1;
  return `UF-CST/${String(n).padStart(2, '0')}`;
}

export function ProductForm({ cars, initial, onDone }: Props) {
  const { t, lt } = useI18n();
  const editing = initial != null;

  const [nameRu, setNameRu] = useState(initial?.name.ru ?? '');
  const [nameEn, setNameEn] = useState(initial?.name.en ?? '');
  const [descRu, setDescRu] = useState(initial?.desc.ru ?? '');
  const [descEn, setDescEn] = useState(initial?.desc.en ?? '');
  const [price, setPrice] = useState(initial ? String(initial.price) : '');
  const [weight, setWeight] = useState(initial ? String(initial.weightGrams) : '');
  const [heat, setHeat] = useState(initial ? String(initial.heatC) : '');
  const [rarity, setRarity] = useState<MaterialGrade>(initial?.rarity ?? 'abs');
  const [materialRu, setMaterialRu] = useState(initial?.material.ru ?? '');
  const [materialEn, setMaterialEn] = useState(initial?.material.en ?? '');
  const [fits, setFits] = useState<string[]>(initial?.fits ?? []);
  const [media, setMedia] = useState<MediaRow[]>(
    initial?.media.length
      ? initial.media.map((m) => ({ type: m.type, url: m.url }))
      : [{ type: 'image', url: '' }]
  );
  const [hit, setHit] = useState(initial?.hit ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [flash, setFlash] = useState(false);

  const previewSeed = useMemo(() => initial?.id ?? `draft-${nameEn || nameRu || 'kit'}`, [initial, nameEn, nameRu]);

  const toggleFit = (id: string) =>
    setFits((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  const setMediaRow = (i: number, patch: Partial<MediaRow>) =>
    setMedia((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const reset = () => {
    setNameRu(''); setNameEn(''); setDescRu(''); setDescEn('');
    setPrice(''); setWeight(''); setHeat('');
    setRarity('abs'); setMaterialRu(''); setMaterialEn('');
    setFits([]); setMedia([{ type: 'image', url: '' }]); setHit(false);
    setErrors({});
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!nameRu.trim()) errs.nameRu = 'admin.err.required';
    if (!nameEn.trim()) errs.nameEn = 'admin.err.required';
    if (!descRu.trim()) errs.descRu = 'admin.err.required';
    if (!descEn.trim()) errs.descEn = 'admin.err.required';
    if (Number.isNaN(posNum(price))) errs.price = 'admin.err.number';
    if (Number.isNaN(posNum(weight))) errs.weight = 'admin.err.number';
    if (Number.isNaN(posNum(heat))) errs.heat = 'admin.err.number';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const id = editing ? initial!.id : makeId(nameEn);
    const mediaItems: MediaItem[] = media
      .filter((m) => m.url.trim())
      .map((m, i) => ({ type: m.type, url: m.url.trim(), seed: `${id}-${i}` }));

    const payload: Product = {
      id,
      sku: editing ? initial!.sku : nextCustomSku(),
      name: { ru: nameRu.trim(), en: nameEn.trim() },
      desc: { ru: descRu.trim(), en: descEn.trim() },
      price: posNum(price),
      weightGrams: posNum(weight),
      heatC: posNum(heat),
      rarity,
      material: { ru: materialRu.trim(), en: materialEn.trim() },
      fits,
      media: mediaItems,
      hit,
    };

    if (editing) {
      api.updateProduct(id, payload);
      onDone();
    } else {
      api.addProduct(payload);
      reset();
      setFlash(true);
      window.setTimeout(() => setFlash(false), 2600);
    }
  };

  const err = (key: string) =>
    errors[key] ? <span className="adm-err">{t(errors[key])}</span> : null;
  const cls = (key: string) => `field${errors[key] ? ' invalid' : ''}`;

  return (
    <div className="panel rivets adm-form">
      <div className="adm-block-title">
        <span className="tape">
          {editing ? t('admin.form.editTitle', { sku: initial!.sku }) : t('admin.form.addTitle')}
        </span>
        {editing && initial!.custom && <span className="adm-badge">{t('admin.badge.custom')}</span>}
      </div>

      <form onSubmit={submit} noValidate>
        <div className="adm-grid">
          <div className="adm-fld">
            <label htmlFor="pf-name-ru">{t('admin.f.nameRu')}</label>
            <input id="pf-name-ru" className={cls('nameRu')} value={nameRu} onChange={(e) => setNameRu(e.target.value)} />
            {err('nameRu')}
          </div>
          <div className="adm-fld">
            <label htmlFor="pf-name-en">{t('admin.f.nameEn')}</label>
            <input id="pf-name-en" className={cls('nameEn')} value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
            {err('nameEn')}
          </div>

          <div className="adm-fld">
            <label htmlFor="pf-desc-ru">{t('admin.f.descRu')}</label>
            <textarea id="pf-desc-ru" className={cls('descRu')} value={descRu} onChange={(e) => setDescRu(e.target.value)} />
            {err('descRu')}
          </div>
          <div className="adm-fld">
            <label htmlFor="pf-desc-en">{t('admin.f.descEn')}</label>
            <textarea id="pf-desc-en" className={cls('descEn')} value={descEn} onChange={(e) => setDescEn(e.target.value)} />
            {err('descEn')}
          </div>

          <div className="adm-fld">
            <label htmlFor="pf-price">{t('admin.f.price')}</label>
            <input id="pf-price" className={cls('price')} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
            {err('price')}
          </div>
          <div className="adm-fld">
            <label htmlFor="pf-weight">{t('admin.f.weight')}</label>
            <input id="pf-weight" className={cls('weight')} inputMode="numeric" value={weight} onChange={(e) => setWeight(e.target.value)} />
            {err('weight')}
          </div>

          <div className="adm-fld">
            <label htmlFor="pf-heat">{t('admin.f.heat')}</label>
            <input
              id="pf-heat"
              className={cls('heat')}
              style={{ maxWidth: 140 }}
              inputMode="numeric"
              value={heat}
              onChange={(e) => setHeat(e.target.value)}
            />
            {err('heat')}
          </div>
          <div className="adm-fld">
            <label htmlFor="pf-rarity">{t('admin.f.rarity')}</label>
            <select id="pf-rarity" className="field" value={rarity} onChange={(e) => setRarity(e.target.value as MaterialGrade)}>
              {GRADE_ORDER.map((r) => (
                <option key={r} value={r}>
                  {lt(GRADE_META[r].label)}
                </option>
              ))}
            </select>
          </div>

          <div className="adm-fld">
            <label htmlFor="pf-mat-ru">{t('admin.f.materialRu')}</label>
            <input id="pf-mat-ru" className="field" value={materialRu} onChange={(e) => setMaterialRu(e.target.value)} />
          </div>
          <div className="adm-fld">
            <label htmlFor="pf-mat-en">{t('admin.f.materialEn')}</label>
            <input id="pf-mat-en" className="field" value={materialEn} onChange={(e) => setMaterialEn(e.target.value)} />
          </div>

          <div className="adm-fld span2">
            <label>{t('admin.f.fits')}</label>
            <div className="adm-chips">
              {cars.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`adm-chip ${fits.includes(c.id) ? 'on' : ''}`}
                  onClick={() => toggleFit(c.id)}
                >
                  {c.make} {c.model}
                </button>
              ))}
            </div>
          </div>

          <div className="adm-fld span2">
            <label>{t('admin.f.media')}</label>
            <div className="adm-media-list">
              {media.map((m, i) => (
                <div key={i} className="adm-media-row">
                  <Img className="adm-thumb" src={m.url.trim() || undefined} seed={`${previewSeed}-${i}`} alt="" />
                  <input
                    className="field"
                    placeholder={t('admin.media.urlPh')}
                    value={m.url}
                    onChange={(e) => setMediaRow(i, { url: e.target.value })}
                  />
                  <select
                    className="field"
                    value={m.type}
                    onChange={(e) => setMediaRow(i, { type: e.target.value as MediaRow['type'] })}
                  >
                    <option value="image">{t('admin.media.image')}</option>
                    <option value="video">{t('admin.media.video')}</option>
                  </select>
                  <button
                    type="button"
                    className="adm-mini-btn danger"
                    disabled={media.length === 1}
                    onClick={() => setMedia((rows) => rows.filter((_, j) => j !== i))}
                  >
                    {t('admin.media.remove')}
                  </button>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10 }}>
              <button type="button" className="adm-mini-btn" onClick={() => setMedia((rows) => [...rows, { type: 'image', url: '' }])}>
                {t('admin.media.add')}
              </button>
            </div>
          </div>

          <div className="adm-fld span2">
            <label className="adm-check">
              <input type="checkbox" checked={hit} onChange={(e) => setHit(e.target.checked)} />
              {t('admin.f.hit')}
            </label>
          </div>
        </div>

        <div className="adm-form-actions">
          <button type="submit" className="btn">
            {editing ? t('common.save') : t('admin.form.add')}
          </button>
          {editing && (
            <button type="button" className="btn ghost" onClick={onDone}>
              {t('common.cancel')}
            </button>
          )}
          {flash && <span className="adm-flash">{t('admin.form.saved')}</span>}
        </div>
      </form>
    </div>
  );
}
