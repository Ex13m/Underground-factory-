/** Вкладка ТАЧКИ: справочник фитмента + добавление custom-моделей.
 *  Клик по превью или кнопка «Карточка» — большая модалка тачки с видео,
 *  как в каталоге. */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import { Img } from '../../lib/media';
import { readGenKeys } from '../../lib/imagegen';
import { getOverride, moveOverride, setOverride } from '../../lib/mediaStore';
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
  /** авто-генерация заставки идёт прямо сейчас (кнопка мерцает) */
  const [liveBusy, setLiveBusy] = useState<Record<string, boolean>>({});
  const [liveErr, setLiveErr] = useState<Record<string, string>>({});

  /** фото → компактный dataURL (jpeg ≤1280) для image-to-video */
  const shrinkPhoto = async (src: string): Promise<string> => {
    const blob = await fetch(src).then((r) => (r.ok ? r.blob() : Promise.reject(new Error('фото недоступно'))));
    const url = URL.createObjectURL(blob);
    try {
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = url;
      });
      const k = Math.min(1, 1280 / Math.max(img.width, img.height));
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.width * k);
      cv.height = Math.round(img.height * k);
      cv.getContext('2d')!.drawImage(img, 0, 0, cv.width, cv.height);
      return cv.toDataURL('image/jpeg', 0.85);
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  /** АВТО-перегенерация заставки через Replicate: кнопка мерцает до готовности,
      результат сразу оживает в карточке (видео-оверрайд этого браузера).
      Нет ключа — откат на старую заявку в очередь (исполнит Claude). */
  const regenLive = async (c: CarModel) => {
    const carId = c.id;
    if (liveBusy[carId]) return;
    const rKey = readGenKeys().replicate?.trim();
    const keyHeader: Record<string, string> = rKey ? { 'x-replicate-key': rKey } : {};
    setLiveBusy((s) => ({ ...s, [carId]: true }));
    setLiveErr((s) => ({ ...s, [carId]: '' }));
    try {
      const src = getOverride(`car-${carId}`)?.url ?? (c.img || undefined);
      if (!src) throw new Error('у карточки нет фото');
      const image = await shrinkPhoto(src);
      const start = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...keyHeader },
        body: JSON.stringify({ video: { image } }),
      });
      const sd = await start.json().catch(() => ({} as { job?: string; error?: string }));
      if (!start.ok || !sd?.job) throw new Error(String(sd?.error ?? `HTTP ${start.status}`));
      // поллинг до готовности (видео ~1-5 минут)
      let resultUrl = '';
      for (let i = 0; i < 80; i++) {
        await new Promise((r) => setTimeout(r, 6000));
        const st = await fetch(`/api/generate?job=${sd.job}`, { headers: keyHeader });
        const sj = await st.json().catch(() => ({} as { status?: string; error?: string; url?: string }));
        if (sj?.status === 'succeeded') { resultUrl = sj?.url ?? ''; break; }
        if (sj?.status === 'failed' || sj?.status === 'canceled') throw new Error(String(sj?.error ?? 'генерация не удалась'));
      }
      if (!resultUrl) throw new Error('таймаут генерации');
      const f = await fetch(`/api/generate?job=${sd.job}&fetch=1`, { headers: keyHeader });
      if (!f.ok) throw new Error(`result ${f.status}`);
      const video = await f.blob();
      await setOverride(`car-live-${carId}`, 'video', video, { prompt: 'заставка ▸ авто Replicate' });
      // заявка Claude: закоммитить ГОТОВЫЙ ролик в репозиторий для всех посетителей
      fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: `car-live-${carId}`,
          kind: 'video',
          prompt: `ГОТОВАЯ заставка (сгенерирована Replicate из браузера, у админа уже играет): скачать ${resultUrl} → пережать → /media/cars/${carId}/live.mp4 + livemap`,
          width: 1280,
          height: 720,
          createdAt: Date.now(),
        }),
      }).catch(() => {});
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setLiveErr((s) => ({ ...s, [carId]: msg }));
      // без ключа автогенерация невозможна — падаем на старую очередь
      if (msg.includes('NO_SERVER_KEY')) orderLive(carId, `${c.make} ${c.model}`, true);
    }
    setLiveBusy((s) => ({ ...s, [carId]: false }));
  };
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
      (image-to-video СТРОГО от главного фото карточки). redo — перегенерация:
      старый live.mp4 заменяется новым от актуального главного фото.
      ВАЖНО: фото кастомных тачек живут только в этом браузере, поэтому
      главное фото прикладываем к заявке через файловый мост /api/track. */
  const orderLive = async (carId: string, carName: string, redo = false) => {
    let photoRef = '';
    try {
      const src = getOverride(`car-${carId}`)?.url ?? cars.find((c) => c.id === carId)?.img;
      if (src) {
        const blob = await fetch(src).then((r) => (r.ok ? r.blob() : null));
        if (blob && blob.size > 0 && blob.size <= 4.2 * 1048576) {
          const dataBase64 = await new Promise<string>((res, rej) => {
            const fr = new FileReader();
            fr.onload = () => res(String(fr.result).split(',')[1] ?? '');
            fr.onerror = () => rej(fr.error);
            fr.readAsDataURL(blob);
          });
          const name = `car-${carId}-main.jpg`;
          const up = await fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, dataBase64 }),
          });
          if (up.ok) photoRef = name;
        }
      }
    } catch { /* мост недоступен — заявка уйдёт без файла, Claude разберётся */ }
    fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: `car-live-${carId}`,
        kind: 'video',
        prompt:
          `${redo ? 'ПЕРЕГЕНЕРАЦИЯ видео-заставки (старый ролик заменить)' : 'видео-заставка (оживление)'} тачки ${carName}: ` +
          `image-to-video СТРОГО от главного фото её карточки (консистентность кузова обязательна) — ` +
          `машина стоит, лёгкий кинематографичный облёт камеры, ночной цех, дым, блики; кладётся в /media/cars/${carId}/live.mp4` +
          (photoRef ? `; главное фото приложено: GET /api/track?name=${photoRef}` : ''),
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
          admin
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
                      {hasLive && (
                        <span className="adm-badge hit" title={c.video ?? ''}>{t('admin.cars.liveHave')}</span>
                      )}
                      {liveBusy[c.id] ? (
                        // авто-генерация идёт: кнопка красиво мерцает до готовности
                        <button className="adm-mini-btn gen-blink" disabled>
                          {t('admin.cars.liveBusy')}
                        </button>
                      ) : liveQueued[c.id] ? (
                        <span className="adm-badge" style={{ color: 'var(--hazard, #e0a51b)', borderColor: 'var(--hazard, #e0a51b)' }}>
                          {t('admin.cars.liveQueued')}
                        </span>
                      ) : (
                        // авто-генерация через Replicate от главного фото карточки
                        <button
                          className="adm-mini-btn"
                          title={liveErr[c.id] || t('admin.cars.liveRedoHint')}
                          style={liveErr[c.id] ? { borderColor: 'var(--blood)', color: 'var(--blood)' } : undefined}
                          onClick={() => void regenLive(c)}
                        >
                          {hasLive ? t('admin.cars.liveRedo') : t('admin.cars.live')}
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
