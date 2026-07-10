/** Вкладка ТАЧКИ: справочник фитмента + добавление custom-моделей.
 *  Клик по превью или кнопка «Карточка» — большая модалка тачки с видео,
 *  как в каталоге. */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import { Img } from '../../lib/media';
import { getOverride, moveOverride } from '../../lib/mediaStore';
import { openArtEditor } from '../../fx/ArtEditor';
import { useCatalog } from '../../store/catalog';
import { liveClipOf } from '../../data/livemap';
import { CarModal } from '../shop/CarModal';
import type { CarModel } from '../../lib/types';
import { makeId } from './util';

/** маркер пункта «добавить новую марку» в селекте */
const NEW_MAKE = '__new__';

export function CarsTab() {
  const { t } = useI18n();
  const cars = useCatalog((s) => s.cars);
  const navigate = useNavigate();
  /** тачка, открытая в большой модалке (как в каталоге) */
  const [viewCar, setViewCar] = useState<CarModel | null>(null);

  // марки — селект из всех, что уже есть на сайте (сид + кастомные);
  // «➕ новая марка» открывает поле ввода, после добавления тачки марка
  // автоматически «запоминается» — список строится из каталога
  const makes = [...new Set(cars.map((c) => c.make))].sort((a, b) => a.localeCompare(b));
  const [makeSel, setMakeSel] = useState('');
  const [newMake, setNewMake] = useState('');
  const make = makeSel === NEW_MAKE ? newMake : makeSel;
  const [model, setModel] = useState('');
  const [years, setYears] = useState('');
  const [img, setImg] = useState('');
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  /** модели выбранной марки — подсказки в поле модели */
  const modelsOfMake = cars.filter((c) => c.make === make).map((c) => c.model);

  /** заявки на видео-заставки: реальное состояние очереди сервера + свежие отправки */
  const [liveQueued, setLiveQueued] = useState<Record<string, boolean>>({});
  useEffect(() => {
    fetch('/api/queue')
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        if (!Array.isArray(list)) return;
        const q: Record<string, boolean> = {};
        for (const tk of list) {
          const m = String(tk?.key ?? '').match(/^car-live-(.+)$/);
          if (m) q[m[1]] = true;
        }
        setLiveQueued((s) => ({ ...q, ...s }));
      })
      .catch(() => {});
  }, []);

  /** заказать видео-заставку тачки: заявка в очередь, исполняет Claude
      (image-to-video от текущего фото тачки) */
  const orderLive = (carId: string, carName: string) => {
    fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: `car-live-${carId}`,
        kind: 'video',
        prompt: `видео-заставка (оживление) тачки ${carName}: image-to-video от её текущего фото — машина стоит, лёгкий кинематографичный облёт камеры, ночной цех, дым, блики; кладётся в /media/cars/${carId}/live.mp4`,
        width: 1280,
        height: 720,
        createdAt: Date.now(),
      }),
    })
      .then((r) => { if (r.ok) setLiveQueued((s) => ({ ...s, [carId]: true })); })
      .catch(() => {});
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, boolean> = {
      make: !make.trim(),
      model: !model.trim(),
      years: !years.trim(),
    };
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    const id = makeId(`${make} ${model}`);
    api.addCar({
      id,
      make: make.trim(),
      model: model.trim(),
      years: years.trim(),
      img: img.trim(),
    });
    // сгенерированное в черновике фото переезжает на итоговый сид тачки
    void moveOverride(`car-draft-${make}-${model}`, `car-${id}`);
    setMakeSel(''); setNewMake(''); setModel(''); setYears(''); setImg('');
    setErrors({});
  };

  const remove = (id: string) => {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    api.deleteCar(id);
  };

  const err = (key: string) =>
    errors[key] ? <span className="adm-err">{t('admin.err.required')}</span> : null;
  const cls = (key: string) => `field${errors[key] ? ' invalid' : ''}`;

  return (
    <div className="adm-section">
      {/* большая карточка тачки — та же модалка, что в каталоге (видео-шапка) */}
      {viewCar && (
        <CarModal
          car={viewCar}
          onClose={() => setViewCar(null)}
          onPickInCatalog={(carId) => {
            setViewCar(null);
            navigate(`/catalog?car=${encodeURIComponent(carId)}`);
          }}
        />
      )}
      <div className="panel">
        <div className="adm-block-title">
          <h2 className="stencil">{t('admin.cars.title')}</h2>
          <span className="tech-label">{t('admin.products.count', { n: cars.length })}</span>
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>{t('admin.col.media')}</th>
                <th>{t('admin.col.make')}</th>
                <th>{t('admin.col.model')}</th>
                <th>{t('admin.col.years')}</th>
                <th style={{ textAlign: 'right' }}>{t('admin.col.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {cars.map((c) => {
                // видео-заставка: сид-поле, карта кастомных (livemap) или оверрайд
                const hasLive = !!liveClipOf(c.id, c.video) || !!getOverride(`car-live-${c.id}`);
                return (
                <tr key={c.id}>
                  <td>
                    {/* клик по превью — большая карточка тачки с видео */}
                    <button
                      type="button"
                      className="adm-thumb-btn"
                      onClick={() => setViewCar(c)}
                      title={t('admin.cars.open')}
                    >
                      <Img className="adm-thumb" src={c.img || undefined} seed={`car-${c.id}`} alt={`${c.make} ${c.model}`} />
                    </button>
                  </td>
                  <td>{c.make}</td>
                  <td>{c.model}</td>
                  <td>{c.years}</td>
                  <td>
                    <div className="adm-actions">
                      <button className="adm-mini-btn" onClick={() => setViewCar(c)}>
                        {t('admin.cars.open')}
                      </button>
                      {hasLive ? (
                        <span className="adm-badge hit" title={c.video ?? ''}>{t('admin.cars.liveHave')}</span>
                      ) : liveQueued[c.id] ? (
                        <span className="adm-badge" style={{ color: 'var(--hazard, #e0a51b)', borderColor: 'var(--hazard, #e0a51b)' }}>
                          {t('admin.cars.liveQueued')}
                        </span>
                      ) : (
                        <button className="adm-mini-btn" onClick={() => orderLive(c.id, `${c.make} ${c.model}`)}>
                          {t('admin.cars.live')}
                        </button>
                      )}
                      <button
                        className="adm-mini-btn"
                        onClick={() =>
                          openArtEditor({
                            key: `car-${c.id}`,
                            kind: 'image',
                            src: getOverride(`car-${c.id}`)?.url ?? (c.img || undefined),
                            width: 800,
                            height: 500,
                          })
                        }
                      >
                        {t('admin.media.gen')}
                      </button>
                      {c.custom ? (
                        <>
                          <span className="adm-badge">{t('admin.badge.custom')}</span>
                          <button className="adm-mini-btn danger" onClick={() => remove(c.id)}>
                            {t('common.delete')}
                          </button>
                        </>
                      ) : (
                        <span className="adm-badge dim">{t('admin.badge.seed')}</span>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel rivets adm-form">
        <div className="adm-block-title">
          <span className="tape">{t('admin.cars.addTitle')}</span>
        </div>
        <form onSubmit={submit} noValidate>
          <div className="adm-grid">
            <div className="adm-fld">
              <label htmlFor="cf-make">{t('admin.f.make')}</label>
              <select
                id="cf-make"
                className={cls('make')}
                value={makeSel}
                onChange={(e) => setMakeSel(e.target.value)}
                data-testid="cf-make"
              >
                <option value="">{t('admin.f.makePick')}</option>
                {makes.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
                <option value={NEW_MAKE}>{t('admin.f.makeNew')}</option>
              </select>
              {makeSel === NEW_MAKE && (
                <input
                  className={cls('make')}
                  style={{ marginTop: 6 }}
                  value={newMake}
                  onChange={(e) => setNewMake(e.target.value)}
                  placeholder={t('admin.f.makeNewPh')}
                  autoFocus
                />
              )}
              {err('make')}
            </div>
            <div className="adm-fld">
              <label htmlFor="cf-model">{t('admin.f.model')}</label>
              <input
                id="cf-model"
                className={cls('model')}
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={makeSel === NEW_MAKE ? t('admin.f.modelFirstPh') : 'Silvia S15'}
                list="cf-model-list"
              />
              {/* подсказки: модели этой марки, уже живущие на сайте */}
              <datalist id="cf-model-list">
                {modelsOfMake.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
              {err('model')}
            </div>
            <div className="adm-fld">
              <label htmlFor="cf-years">{t('admin.f.years')}</label>
              <input id="cf-years" className={cls('years')} value={years} onChange={(e) => setYears(e.target.value)} placeholder="1999–2002" />
              {err('years')}
            </div>
            <div className="adm-fld">
              <label htmlFor="cf-img">{t('admin.f.img')}</label>
              <div className="adm-inline">
                <Img className="adm-thumb" src={img.trim() || undefined} seed={`car-draft-${make}-${model}`} alt="" />
                <button
                  type="button"
                  className="adm-mini-btn"
                  onClick={() =>
                    openArtEditor({
                      key: `car-draft-${make}-${model}`,
                      kind: 'image',
                      src: getOverride(`car-draft-${make}-${model}`)?.url ?? (img.trim() || undefined),
                      width: 800,
                      height: 500,
                    })
                  }
                >
                  {t('admin.media.gen')}
                </button>
                <input
                  id="cf-img"
                  className="field"
                  style={{ flex: 1, minWidth: 180 }}
                  value={img}
                  onChange={(e) => setImg(e.target.value)}
                  placeholder={t('admin.media.urlPh')}
                />
              </div>
            </div>
          </div>
          <div className="adm-form-actions">
            <button type="submit" className="btn">
              {t('common.add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
