import { useMemo, useState } from 'react';
import { useCatalog } from '../../store/catalog';
import { useI18n } from '../../lib/i18n';
import '../../styles/shop.css';

/**
 * CAR-FIRST выбор тачки: марка → модель → CTA.
 * Хозяин решает, что делать с выбранным carId (навигация / query-параметр).
 * instant — выбор модели срабатывает сразу, без кнопки (каталог).
 */
export function CarPicker({
  onPick,
  initialCarId,
  ctaLabel,
  instant = false,
}: {
  onPick: (carId: string) => void;
  initialCarId?: string | null;
  ctaLabel?: string;
  instant?: boolean;
}) {
  const { t } = useI18n();
  const cars = useCatalog((s) => s.cars);

  const initial = initialCarId ? cars.find((c) => c.id === initialCarId) : undefined;
  const [make, setMake] = useState<string>(initial?.make ?? '');
  const [modelId, setModelId] = useState<string>(initial?.id ?? '');

  const makes = useMemo(() => Array.from(new Set(cars.map((c) => c.make))), [cars]);
  const models = useMemo(() => cars.filter((c) => c.make === make), [cars, make]);

  return (
    <div className="carpicker">
      <label>
        <span className="tech-label">{t('catalog.picker.make')}</span>
        <select
          className="field"
          value={make}
          onChange={(e) => {
            setMake(e.target.value);
            setModelId('');
          }}
        >
          <option value="">{t('catalog.picker.makePh')}</option>
          {makes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="tech-label">{t('catalog.picker.model')}</span>
        <select
          className="field"
          value={modelId}
          onChange={(e) => {
            const id = e.target.value;
            setModelId(id);
            // мгновенный режим: смена модели сразу применяет выбор
            if (instant && id) onPick(id);
          }}
          disabled={!make}
        >
          <option value="">{t('catalog.picker.modelPh')}</option>
          {models.map((c) => (
            <option key={c.id} value={c.id}>
              {c.model} · {c.years}
            </option>
          ))}
        </select>
      </label>
      {!instant && (
        <button type="button" className="btn" disabled={!modelId} onClick={() => onPick(modelId)}>
          {ctaLabel ?? t('catalog.picker.cta')} ▸
        </button>
      )}
    </div>
  );
}
