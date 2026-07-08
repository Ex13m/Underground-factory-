/**
 * Витрина тачек над каталогом: ряд чипов-брендов + бесконечная карусель
 * карточек машин. Лента сама медленно едет по кругу (список задублирован,
 * scrollLeft закольцован); колёсико крутит её в обе стороны по кругу;
 * пауза — при наведении и когда тачка выбрана (фильтр активен).
 * Одиночный клик — фильтр каталога, двойной — большая модалка (CarModal).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useCatalog } from '../../store/catalog';
import { useUI } from '../../store/ui';
import { Img } from '../../lib/media';

export function CarShowcase({
  onOpen,
  onFilter,
  activeCarId,
}: {
  onOpen: (carId: string) => void;
  onFilter: (carId: string) => void;
  /** тачка, по которой сейчас отфильтрован каталог (подсветка в ленте) */
  activeCarId?: string | null;
}) {
  const { t } = useI18n();
  const cars = useCatalog((s) => s.cars);
  const products = useCatalog((s) => s.products);
  const calm = useUI((s) => s.calm);

  // null = «ВСЕ»; иначе — выбранная марка
  const [make, setMake] = useState<string | null>(null);

  // уникальные марки — в порядке появления в каталоге
  const makes = useMemo(() => [...new Set(cars.map((c) => c.make))], [cars]);
  const shown = make ? cars.filter((c) => c.make === make) : cars;

  // бесконечный круг: рендерим список дважды и закольцовываем scrollLeft
  const loop = shown.length > 2;
  const items = loop ? [...shown, ...shown] : shown;

  // сколько деталей реально встанет на эту тачку
  const kitCount = (carId: string) => products.filter((p) => p.fits.includes(carId)).length;

  const trackRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef(false);

  /** перескок через «шов» дубликата — лента кажется бесконечной */
  const wrapAround = (el: HTMLDivElement) => {
    if (!loop) return;
    const half = el.scrollWidth / 2;
    if (half <= el.clientWidth) return; // прокрутки нет — нечего кольцевать
    if (el.scrollLeft >= half) el.scrollLeft -= half;
    else if (el.scrollLeft <= 0) el.scrollLeft += half;
  };

  // колёсико мыши крутит карусель по кругу в обе стороны; passive:false,
  // чтобы preventDefault останавливал прокрутку страницы под курсором.
  // Тачпад (deltaX доминирует) не трогаем — нативный скролл по X работает.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
        wrapAround(el);
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loop]);

  // самоход: лента медленно едет по кругу; стоп — при наведении,
  // выбранной тачке (фильтр активен), calm-режиме и reduced-motion
  useEffect(() => {
    const el = trackRef.current;
    if (!el || !loop) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || calm) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (hoverRef.current || activeCarId) return;
      el.scrollLeft += 26 * dt; // ~26 px/с — прогулочный темп
      wrapAround(el);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loop, calm, activeCarId, shown.length]);

  // разведение одиночного и двойного клика: одиночный (фильтр) уходит
  // с задержкой ~250 мс и отменяется, если прилетел dblclick (модалка)
  const clickTimer = useRef<number | null>(null);
  const cancelPending = () => {
    if (clickTimer.current !== null) {
      window.clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
  };
  useEffect(() => cancelPending, []);
  const handleClick = (carId: string) => {
    cancelPending();
    clickTimer.current = window.setTimeout(() => {
      clickTimer.current = null;
      onFilter(carId);
    }, 250);
  };
  const handleDoubleClick = (carId: string) => {
    cancelPending();
    onOpen(carId);
  };

  return (
    <div className="carshow">
      <div className="carshow-head">
        <span className="tape dark">{t('catalog.cars.tape')}</span>
        <span className="tech-label">{t('catalog.cars.title')}</span>
        <span className="tech-label carshow-hint">{t('catalog.cars.hint')}</span>
      </div>

      <div className="carshow-brands">
        <button
          type="button"
          className={`carshow-brand${make === null ? ' on' : ''}`}
          onClick={() => setMake(null)}
        >
          {t('catalog.cars.all')}
        </button>
        {makes.map((m) => (
          <button
            key={m}
            type="button"
            className={`carshow-brand${make === m ? ' on' : ''}`}
            onClick={() => setMake(m)}
          >
            {m}
          </button>
        ))}
      </div>

      <div
        className="carshow-track"
        ref={trackRef}
        onMouseEnter={() => { hoverRef.current = true; }}
        onMouseLeave={() => { hoverRef.current = false; }}
      >
        {items.map((c, i) => (
          <button
            key={`${c.id}-${i}`}
            type="button"
            className={`carshow-card panel${activeCarId === c.id ? ' active' : ''}`}
            title={t('catalog.cars.hint')}
            onClick={() => handleClick(c.id)}
            onDoubleClick={() => handleDoubleClick(c.id)}
            // фикс «клика со второго раза»: не отдаём фокус по mousedown —
            // иначе браузер скроллит кнопку в зону видимости, mandatory-snap
            // сдвигает ленту, и mouseup ловит уже другую цель (click не срабатывает)
            onMouseDown={(e) => e.preventDefault()}
          >
            <span className="carshow-media">
              <Img src={c.img} seed={`car-${c.id}`} alt={`${c.make} ${c.model}`} />
            </span>
            <span className="carshow-name">
              {c.make} {c.model}
            </span>
            <span className="carshow-years tech-label">{c.years}</span>
            <span className="carshow-kits">{t('catalog.cars.kits', { n: kitCount(c.id) })}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
