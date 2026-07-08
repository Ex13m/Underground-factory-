/** Вкладка ТАЧКИ: справочник фитмента + добавление custom-моделей. */

import { useState } from 'react';
import { api } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import { Img } from '../../lib/media';
import { getOverride, moveOverride } from '../../lib/mediaStore';
import { openArtEditor } from '../../fx/ArtEditor';
import { useCatalog } from '../../store/catalog';
import { makeId } from './util';

export function CarsTab() {
  const { t } = useI18n();
  const cars = useCatalog((s) => s.cars);

  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [years, setYears] = useState('');
  const [img, setImg] = useState('');
  const [errors, setErrors] = useState<Record<string, boolean>>({});

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
    setMake(''); setModel(''); setYears(''); setImg('');
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
              {cars.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Img className="adm-thumb" src={c.img || undefined} seed={`car-${c.id}`} alt={`${c.make} ${c.model}`} />
                  </td>
                  <td>{c.make}</td>
                  <td>{c.model}</td>
                  <td>{c.years}</td>
                  <td>
                    <div className="adm-actions">
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
              ))}
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
              <input id="cf-make" className={cls('make')} value={make} onChange={(e) => setMake(e.target.value)} placeholder="Nissan" />
              {err('make')}
            </div>
            <div className="adm-fld">
              <label htmlFor="cf-model">{t('admin.f.model')}</label>
              <input id="cf-model" className={cls('model')} value={model} onChange={(e) => setModel(e.target.value)} placeholder="Silvia S15" />
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
