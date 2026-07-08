/** СЕКЦИЯ A // ГАРАЖ — car-first: тачки юзера, активная, добавление. */
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../store/auth';
import { useCatalog } from '../../store/catalog';
import { useI18n } from '../../lib/i18n';
import { Img } from '../../lib/media';
import '../../styles/account.css';

export function GarageSection() {
  const { t } = useI18n();
  const garage = useAuth((s) => s.garage);
  const activeCarId = useAuth((s) => s.activeCarId);
  const setActiveCar = useAuth((s) => s.setActiveCar);
  const addGarageCar = useAuth((s) => s.addGarageCar);
  const removeGarageCar = useAuth((s) => s.removeGarageCar);
  const cars = useCatalog((s) => s.cars);

  const [modelId, setModelId] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [img, setImg] = useState('');
  const [err, setErr] = useState(false);

  const pickModel = (id: string) => {
    setModelId(id);
    setErr(false);
    const car = cars.find((c) => c.id === id);
    if (car) {
      setMake(car.make);
      setModel(car.model);
      setYear(car.years);
      setImg(car.img);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!make.trim() || !model.trim()) {
      setErr(true);
      return;
    }
    addGarageCar({
      id: crypto.randomUUID(),
      modelId: modelId || undefined,
      make: make.trim(),
      model: model.trim(),
      year: year.trim(),
      img: img.trim() || undefined,
    });
    setModelId(''); setMake(''); setModel(''); setYear(''); setImg(''); setErr(false);
  };

  return (
    <section>
      <div className="uf-acc-sec-head">
        <h2 className="stencil">{t('account.garage.title')}</h2>
        <span className="tech-label">{t('account.garage.label')}</span>
      </div>

      {garage.length === 0 ? (
        <div className="panel uf-sec-empty">
          <h3>{t('account.garage.empty.title')}</h3>
          <p>{t('account.garage.empty.text')}</p>
        </div>
      ) : (
        <div className="uf-garage-grid">
          {garage.map((car) => {
            const active = car.id === activeCarId;
            return (
              <div
                key={car.id}
                className={`panel rivets uf-garage-card${active ? ' active' : ''}`}
                onClick={() => setActiveCar(car.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') setActiveCar(car.id); }}
                title={active ? undefined : t('account.garage.setActive')}
                data-testid="garage-card"
              >
                {active && <span className="tape uf-garage-card-tape">{t('account.garage.active')}</span>}
                <Img src={car.img} seed={`car-${car.modelId ?? car.id}`} alt={`${car.make} ${car.model}`} />
                <div className="uf-garage-card-body">
                  <h3 className="stencil">
                    <span className="glitch auto" data-text={`${car.make} ${car.model}`}>
                      {car.make} {car.model}
                    </span>
                  </h3>
                  <span className="tech-label">{car.year}</span>
                  <div className="uf-garage-card-actions">
                    <Link
                      to={car.modelId ? `/catalog?car=${car.modelId}` : '/catalog'}
                      className="btn"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t('account.garage.pick')} ▸
                    </Link>
                    <button
                      className="uf-x"
                      title={t('account.garage.remove')}
                      aria-label={t('account.garage.remove')}
                      onClick={(e) => { e.stopPropagation(); removeGarageCar(car.id); }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <form className="panel rivets uf-garage-form" style={{ marginTop: 16 }} onSubmit={submit}>
        <span className="tech-label">{t('account.garage.add.title')}</span>
        <select className="field" value={modelId} onChange={(e) => pickModel(e.target.value)} aria-label={t('account.garage.add.select')}>
          <option value="">{t('account.garage.add.manual')}</option>
          {cars.map((c) => (
            <option key={c.id} value={c.id}>{c.make} {c.model} ({c.years})</option>
          ))}
        </select>
        <div className="uf-garage-form-row">
          <input className="field" value={make} onChange={(e) => { setMake(e.target.value); setModelId(''); setErr(false); }} placeholder={t('account.garage.add.make')} />
          <input className="field" value={model} onChange={(e) => { setModel(e.target.value); setModelId(''); setErr(false); }} placeholder={t('account.garage.add.model')} />
          <input className="field" value={year} onChange={(e) => setYear(e.target.value)} placeholder={t('account.garage.add.year')} />
        </div>
        <input className="field" value={img} onChange={(e) => setImg(e.target.value)} placeholder={t('account.garage.add.img')} />
        {err && <div className="uf-promo-err">{t('account.garage.add.err')}</div>}
        <div>
          <button className="btn dark" type="submit" data-testid="garage-add">{t('account.garage.add.submit')} ▸</button>
        </div>
      </form>
    </section>
  );
}
