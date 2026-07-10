/**
 * Большая модалка тачки: «оживающая» видео-шапка (VideoBg с арт-фолбэком)
 * с глитч-названием («TARGET LOCKED»), фильтр деталей по материалу,
 * кнопка «КУПИТЬ ВЕСЬ КИТ» и сетка обвесов, которые реально встают на
 * эту машину. Открывается из карусели CarShowcase (двойной клик);
 * «ПОДОБРАТЬ В КАТАЛОГЕ» прокидывает фильтр.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../lib/i18n';
import { useCatalog } from '../../store/catalog';
import { useCart } from '../../store/cart';
import { Img, VideoBg } from '../../lib/media';
import { liveClipOf } from '../../data/livemap';
import { useCarGallery } from '../../store/cargallery';
import type { CarModel, MaterialGrade } from '../../lib/types';
import { GRADE_ORDER, GRADE_META } from '../../lib/types';

export function CarModal({
  car,
  onClose,
  onPickInCatalog,
}: {
  car: CarModel;
  onClose: () => void;
  onPickInCatalog: (carId: string) => void;
  /** совместимость со старыми вызовами: карточка всегда показывает только
      РЕЗУЛЬТАТ (альбом); управление альбомом — в библиотеке арт-редактора */
  admin?: boolean;
}) {
  const { t, lt } = useI18n();
  const products = useCatalog((s) => s.products);
  const add = useCart((s) => s.add);

  // только то, что реально встанет на эту тачку
  const fitting = useMemo(() => products.filter((p) => p.fits.includes(car.id)), [products, car.id]);

  // фильтр по материалу: null = «ВСЕ»; чипы — только реально встречающиеся грейды
  const [grade, setGrade] = useState<MaterialGrade | null>(null);
  const grades = useMemo(
    () => GRADE_ORDER.filter((g) => fitting.some((p) => p.rarity === g)),
    [fitting],
  );
  const shown = useMemo(
    () => (grade ? fitting.filter((p) => p.rarity === grade) : fitting),
    [fitting, grade],
  );
  const kitSum = shown.reduce((sum, p) => sum + p.price, 0);

  // «КУПИТЬ ВЕСЬ КИТ»: все отфильтрованные — в корзину + флеш на 2 сек
  const [kitFlash, setKitFlash] = useState<number | null>(null);
  const flashTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    },
    [],
  );
  const buyKit = () => {
    shown.forEach((p) => add(p.id));
    setKitFlash(shown.length);
    if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setKitFlash(null), 2000);
  };

  // приближённый просмотр фото поверх всего (лайтбокс): индекс в imgSlides
  const [zoom, setZoom] = useState<number | null>(null);

  // ---- листалка шапки: слайд 0 — ВСЕГДА видео (если есть), дальше —
  // главное фото и АЛЬБОМ (только одобренные красной галочкой в библиотеке
  // арт-редактора; никаких пустых слайдов и складских черновиков) ----
  const galleryAll = useCarGallery((s) => s.photos[car.id] ?? []);
  const live = liveClipOf(car.id, car.video);
  const slides = useMemo(() => {
    const list: Array<{ kind: 'video' | 'image'; url: string }> = [];
    if (live) list.push({ kind: 'video', url: live });
    if (car.img) list.push({ kind: 'image', url: car.img });
    galleryAll.forEach((p) => {
      if (p.on && !list.some((s) => s.url === p.url)) list.push({ kind: 'image', url: p.url });
    });
    // совсем нет медиа — одинокий слайд с арт-заглушкой по seed
    if (!list.length) list.push({ kind: 'image', url: '' });
    return list;
  }, [live, car.img, galleryAll]);
  const [slide, setSlide] = useState(0); // дефолт — видео
  useEffect(() => setSlide(0), [car.id]);
  const cur = slides[Math.min(slide, slides.length - 1)] ?? slides[0];
  const flip = (dir: 1 | -1) => setSlide((i) => (i + dir + slides.length) % slides.length);

  // лайтбокс листает только фото (видео остаётся в шапке)
  const imgSlides = useMemo(() => slides.filter((s) => s.kind === 'image'), [slides]);
  const zoomFlip = (dir: 1 | -1) =>
    setZoom((i) => (i === null || !imgSlides.length ? i : (i + dir + imgSlides.length) % imgSlides.length));

  // Esc: сначала закрывает лайтбокс, потом модалку; ←/→ листают лайтбокс
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (zoom !== null) setZoom(null);
        else onClose();
      }
      if (zoom !== null && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        zoomFlip(e.key === 'ArrowLeft' ? -1 : 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, zoom, imgSlides.length]);

  return (
    <div className="uf-auth-overlay" onClick={onClose} data-testid="car-modal">
      <div className="carmodal" onClick={(e) => e.stopPropagation()}>
        <button className="artedit-x carmodal-x" onClick={onClose} aria-label={t('common.cancel')}>
          ✕
        </button>

        <div className="carmodal-hero">
          {cur?.kind === 'video' ? (
            // «оживающая» тачка: сид-поле video или карта заставок кастомных (livemap)
            <VideoBg sources={[cur.url]} seed={`car-live-${car.id}`} />
          ) : (
            // клик по фото — приближённый просмотр поверх всего
            <button
              type="button"
              className="carmodal-zoom-open"
              onClick={() => cur && setZoom(Math.max(0, imgSlides.indexOf(cur)))}
              aria-label="zoom"
            >
              <Img src={cur?.url || car.img} seed={`car-${car.id}`} alt={`${car.make} ${car.model}`} />
            </button>
          )}
          {/* висящие стрелки листания — только когда есть что листать */}
          {slides.length > 1 && (
            <>
              <button
                type="button"
                className="carmodal-flip left"
                onClick={(e) => { e.stopPropagation(); flip(-1); }}
                aria-label="prev"
              >
                ‹
              </button>
              <button
                type="button"
                className="carmodal-flip right"
                onClick={(e) => { e.stopPropagation(); flip(1); }}
                aria-label="next"
              >
                ›
              </button>
              <div className="carmodal-dots" aria-hidden>
                {slides.map((s, i) => (
                  <i key={i} className={i === slide ? 'on' : ''} title={s.kind} />
                ))}
              </div>
            </>
          )}
          <div className="carmodal-scrim" aria-hidden />
          <div className="carmodal-hero-info">
            <span className="tape">{t('catalog.cars.locked')}</span>
            <h2 className="stencil carmodal-title">
              <span className="glitch auto" data-text={`${car.make} ${car.model}`}>
                {car.make} {car.model}
              </span>
            </h2>
            <div className="carmodal-years">{car.years}</div>
          </div>
        </div>

        <div className="carmodal-body">
          <div className="tech-label" style={{ marginBottom: 12 }}>
            {t('catalog.cars.kits', { n: fitting.length })}
          </div>

          {grades.length > 0 && (
            <div className="carmodal-mats">
              <button
                type="button"
                className={`carshow-brand${grade === null ? ' on' : ''}`}
                onClick={() => setGrade(null)}
              >
                {t('catalog.cars.matAll')}
              </button>
              {grades.map((g) => {
                const meta = GRADE_META[g];
                const active = grade === g;
                return (
                  <button
                    key={g}
                    type="button"
                    className={`carshow-brand${active ? ' on' : ''}`}
                    style={
                      active
                        ? {
                            background: meta.color,
                            borderColor: meta.color,
                            color: meta.glow ? '#fff' : '#0a0a09',
                          }
                        : { color: meta.color }
                    }
                    onClick={() => setGrade(g)}
                  >
                    {lt(meta.label)}
                  </button>
                );
              })}
            </div>
          )}

          <div className="carmodal-grid">
            {shown.map((p) => (
              <article key={p.id} className="carmodal-p">
                <Link to={`/product/${p.id}`} className="carmodal-p-media">
                  <Img src={p.media[0]?.url} seed={p.media[0]?.seed ?? p.id} alt={lt(p.name)} />
                </Link>
                <Link to={`/product/${p.id}`} className="carmodal-p-name">
                  {lt(p.name)}
                </Link>
                <div className="carmodal-p-row">
                  <span className="carmodal-p-price">
                    {t('common.currency')}
                    {p.price}
                  </span>
                  <button type="button" className="pcard-add" onClick={() => add(p.id)}>
                    {t('catalog.cars.toCart')}
                  </button>
                </div>
              </article>
            ))}
          </div>

          {shown.length > 0 && (
            <button
              type="button"
              className={`btn carmodal-cta carmodal-kit${kitFlash !== null ? ' flash' : ''}`}
              onClick={buyKit}
            >
              {kitFlash !== null
                ? t('catalog.cars.kitAdded', { n: kitFlash })
                : t('catalog.cars.buyKit', { sum: `${t('common.currency')}${kitSum}` })}
            </button>
          )}

          <button
            type="button"
            className="btn carmodal-cta"
            onClick={() => {
              onClose();
              onPickInCatalog(car.id);
            }}
          >
            {t('catalog.cars.open')}
          </button>
        </div>
      </div>

      {/* лайтбокс: фото крупно поверх всего, ‹ › и ←/→ листают, Esc/клик закрывает */}
      {zoom !== null && imgSlides[zoom] && (
        <div
          className="carmodal-zoom"
          onClick={(e) => {
            e.stopPropagation();
            setZoom(null);
          }}
          data-testid="car-zoom"
        >
          <img src={imgSlides[zoom].url} alt={`${car.make} ${car.model}`} onClick={(e) => e.stopPropagation()} />
          {imgSlides.length > 1 && (
            <>
              <button
                type="button"
                className="carmodal-flip left"
                onClick={(e) => { e.stopPropagation(); zoomFlip(-1); }}
                aria-label="prev"
              >
                ‹
              </button>
              <button
                type="button"
                className="carmodal-flip right"
                onClick={(e) => { e.stopPropagation(); zoomFlip(1); }}
                aria-label="next"
              >
                ›
              </button>
              <div className="carmodal-dots" aria-hidden>
                {imgSlides.map((_, i) => (
                  <i key={i} className={i === zoom ? 'on' : ''} />
                ))}
              </div>
            </>
          )}
          <button
            className="artedit-x carmodal-zoom-x"
            onClick={(e) => { e.stopPropagation(); setZoom(null); }}
            aria-label={t('common.cancel')}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
