/**
 * Модалка материала: видео «как делают деталь» на фоне, глитч-заголовок,
 * история материала и техпараметры. Открывается с карточек «Три материала»
 * на главной. Данные — api.getMaterial (редактируются в Админке → МАТЕРИАЛЫ).
 */

import { useEffect, useMemo } from 'react';
import { api, onDataChanged } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import { VideoBg } from '../../lib/media';
import { GRADE_META, type MaterialGrade } from '../../lib/types';

export function MaterialModal({ grade, onClose }: { grade: MaterialGrade; onClose: () => void }) {
  const { t, lt } = useI18n();
  const m = useMemo(() => api.getMaterial(grade), [grade]);
  const meta = GRADE_META[grade];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => onDataChanged(() => {}), []);

  return (
    <div className="uf-auth-overlay" onClick={onClose} data-testid="mat-modal">
      <div className="mat-modal" onClick={(e) => e.stopPropagation()}>
        {/* видео-шапка фиксированной пропорции: ролик «как делают деталь» */}
        <div className="mat-modal-hero">
          <VideoBg sources={[m.video]} seed={`mat-${grade}`} className="mat-modal-video" />
          <div className="mat-modal-scrim" aria-hidden />
          <div className="mat-modal-head">
            <span className="tape">{t('home.mat.tape')} // {grade.toUpperCase()}</span>
            <h2 className="stencil mat-modal-title" style={{ color: meta.color }}>
              <span className="glitch auto" data-text={lt(m.name)}>{lt(m.name)}</span>
            </h2>
          </div>
          <button className="artedit-x mat-modal-x" onClick={onClose} aria-label={t('common.cancel')}>
            ✕
          </button>
        </div>
        <div className="mat-modal-body">
          <p className="mat-modal-story">{lt(m.story)}</p>
          <div className="tech-label" style={{ marginBottom: 8 }}>{t('home.mat.specs')}</div>
          <div className="mat-specs">
            {m.specs.map((s, i) => (
              <div key={i} className="mat-spec-row">
                <span>{lt(s.label)}</span>
                <b>{s.value}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
