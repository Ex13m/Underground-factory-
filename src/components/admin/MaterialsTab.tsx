/** Вкладка МАТЕРИАЛЫ: паспорта материалов (история + техпараметры + видео-фон модалки). */

import { useState } from 'react';
import { api } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import { GRADE_META, GRADE_ORDER, type MaterialGrade } from '../../lib/types';
import type { MaterialSpec } from '../../data/materials';

/** Спеки → текст: по строке «Метка RU|Label EN|значение» на параметр. */
function specsToText(specs: MaterialSpec[]): string {
  return specs.map((s) => `${s.label.ru}|${s.label.en}|${s.value}`).join('\n');
}

/** Текст → спеки: строки без двух разделителей «|» пропускаем. */
function parseSpecs(text: string): MaterialSpec[] {
  return text
    .split('\n')
    .map((line) => line.split('|'))
    .filter((parts) => parts.length >= 3)
    .map((parts) => ({
      label: { ru: parts[0].trim(), en: parts[1].trim() },
      value: parts.slice(2).join('|').trim(),
    }));
}

/** Панель одного материала: поля инициализируются из api.getMaterial(grade). */
function MaterialPanel({ grade }: { grade: MaterialGrade }) {
  const { t, lt } = useI18n();
  const initial = api.getMaterial(grade);

  const [nameRu, setNameRu] = useState(initial.name.ru);
  const [nameEn, setNameEn] = useState(initial.name.en);
  const [storyRu, setStoryRu] = useState(initial.story.ru);
  const [storyEn, setStoryEn] = useState(initial.story.en);
  const [video, setVideo] = useState(initial.video);
  const [specsText, setSpecsText] = useState(specsToText(initial.specs));
  const [flash, setFlash] = useState(false);

  const save = () => {
    api.updateMaterial(grade, {
      name: { ru: nameRu.trim(), en: nameEn.trim() },
      story: { ru: storyRu.trim(), en: storyEn.trim() },
      video: video.trim(),
      specs: parseSpecs(specsText),
    });
    setFlash(true);
    window.setTimeout(() => setFlash(false), 2000);
  };

  return (
    <div className="panel rivets adm-form">
      <div className="adm-block-title">
        <span className="tape dark">{lt(GRADE_META[grade].label)}</span>
      </div>

      <div className="adm-grid">
        <div className="adm-fld">
          <label htmlFor={`mat-${grade}-name-ru`}>{t('admin.mat.nameRu')}</label>
          <input id={`mat-${grade}-name-ru`} className="field" value={nameRu} onChange={(e) => setNameRu(e.target.value)} />
        </div>
        <div className="adm-fld">
          <label htmlFor={`mat-${grade}-name-en`}>{t('admin.mat.nameEn')}</label>
          <input id={`mat-${grade}-name-en`} className="field" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
        </div>

        <div className="adm-fld">
          <label htmlFor={`mat-${grade}-story-ru`}>{t('admin.mat.storyRu')}</label>
          <textarea id={`mat-${grade}-story-ru`} className="field" value={storyRu} onChange={(e) => setStoryRu(e.target.value)} />
        </div>
        <div className="adm-fld">
          <label htmlFor={`mat-${grade}-story-en`}>{t('admin.mat.storyEn')}</label>
          <textarea id={`mat-${grade}-story-en`} className="field" value={storyEn} onChange={(e) => setStoryEn(e.target.value)} />
        </div>

        <div className="adm-fld span2">
          <label htmlFor={`mat-${grade}-video`}>{t('admin.mat.video')}</label>
          <input id={`mat-${grade}-video`} className="field" value={video} onChange={(e) => setVideo(e.target.value)} />
        </div>

        <div className="adm-fld span2">
          <label htmlFor={`mat-${grade}-specs`}>{t('admin.mat.specs')}</label>
          <textarea id={`mat-${grade}-specs`} className="field" rows={6} value={specsText} onChange={(e) => setSpecsText(e.target.value)} />
        </div>
      </div>

      <div className="adm-form-actions">
        <button className="btn" onClick={save}>
          {t('admin.mat.save')}
        </button>
        {flash && <span className="adm-flash">{t('admin.mat.saved')}</span>}
      </div>
    </div>
  );
}

export function MaterialsTab() {
  const { t } = useI18n();

  return (
    <div className="adm-section">
      <div className="adm-block-title">
        <h2 className="stencil">{t('admin.mat.title')}</h2>
      </div>
      <p className="adm-note">{t('admin.mat.note')}</p>

      {GRADE_ORDER.map((grade) => (
        <MaterialPanel key={grade} grade={grade} />
      ))}
    </div>
  );
}
