/**
 * Витрина тачек над каталогом: ряд чипов-брендов + горизонтальная
 * карусель карточек машин (scroll-snap). Одиночный клик по карточке
 * фильтрует каталог под тачку, двойной — открывает большую модалку
 * (CarModal). Колёсико мыши крутит ленту по горизонтали.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useCatalog } from '../../store/catalog';
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

  // null = «ВСЕ»; иначе — выбранная марка
  const [make, setMake] = useState<string | null>(null);

  // уникальные марки — в порядке появления в каталоге
  const makes = useMemo(() => [...new Set(cars.map((c) => c.make))], [cars]);
  const shown = make ? cars.filter((c) => c.make === make) : cars;

  // сколько деталей реально встанет на эту тачку
  const kitCount = (carId: string) => products.filter((p) => p.fits.includes(carId)).length;

  // колёсико мыши крутит ленту по горизонтали; passive:false, чтобы
  // preventDefault реально останавливал прокрутку страницы под курсором.
  // Тачпад (deltaX доминирует) не трогаем — нативный скролл по X работает.
  const trackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

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

      <div className="carshow-track" ref={trackRef}>
        {shown.map((c) => (
          <button
            key={c.id}
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
