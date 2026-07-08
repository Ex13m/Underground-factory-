/**
 * Вкладка АРТ: включение арт-редактора (правка картинок промптом прямо на сайте),
 * ключи API генераторов и список текущих замен со сбросом.
 */

import { useEffect, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useUI } from '../../store/ui';
import { readGenKeys, writeGenKeys, type GenProvider } from '../../lib/imagegen';
import { listOverrides, removeOverride, clearOverrides, onMediaChanged } from '../../lib/mediaStore';

export function ArtTab() {
  const { t } = useI18n();
  const artEdit = useUI((s) => s.artEdit);
  const toggleArtEdit = useUI((s) => s.toggleArtEdit);
  const [keys, setKeys] = useState(readGenKeys());
  const [overrides, setOverrides] = useState(listOverrides());

  useEffect(() => onMediaChanged(() => setOverrides(listOverrides())), []);

  const saveKey = (patch: Partial<ReturnType<typeof readGenKeys>>) => {
    writeGenKeys(patch);
    setKeys(readGenKeys());
  };

  return (
    <div className="adm-section">
      <div className="panel rivets">
        <div className="adm-block-title">
          <span className={`tape ${artEdit ? 'hazard' : 'dark'}`}>{t('admin.art.title')}</span>
        </div>
        <p className="adm-note">{t('admin.art.text')}</p>
        <button className="btn" onClick={toggleArtEdit} data-testid="artedit-toggle">
          {artEdit ? t('admin.art.off') : t('admin.art.on')}
        </button>
      </div>

      <div className="panel rivets">
        <div className="adm-block-title">
          <span className="tape dark">{t('admin.art.keysTitle')}</span>
        </div>
        <p className="adm-note">{t('admin.art.keysText')}</p>
        <label className="tech-label" htmlFor="art-key-openai">GPT IMAGE (OpenAI)</label>
        <input
          id="art-key-openai"
          className="field"
          type="password"
          placeholder="sk-…"
          value={keys.openai ?? ''}
          onChange={(e) => saveKey({ openai: e.target.value.trim() || undefined })}
          data-testid="art-key-openai"
        />
        <label className="tech-label" htmlFor="art-key-gemini" style={{ marginTop: 10, display: 'block' }}>
          NANO BANANA 2 (Google Gemini)
        </label>
        <input
          id="art-key-gemini"
          className="field"
          type="password"
          placeholder="AIza…"
          value={keys.gemini ?? ''}
          onChange={(e) => saveKey({ gemini: e.target.value.trim() || undefined })}
          data-testid="art-key-gemini"
        />
        <label className="tech-label" style={{ marginTop: 10, display: 'block' }}>
          {t('admin.art.defProvider')}
        </label>
        <div className="adm-form-actions">
          <button
            className={`btn ${keys.provider === 'openai' ? '' : 'ghost'}`}
            onClick={() => saveKey({ provider: 'openai' as GenProvider })}
          >
            GPT IMAGE
          </button>
          <button
            className={`btn ${(keys.provider ?? 'gemini') === 'gemini' ? '' : 'ghost'}`}
            onClick={() => saveKey({ provider: 'gemini' as GenProvider })}
          >
            NANO BANANA 2
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="adm-block-title">
          <span className="tape dark">{t('admin.art.listTitle', { n: overrides.length })}</span>
        </div>
        {overrides.length === 0 ? (
          <p className="adm-note">{t('admin.art.listEmpty')}</p>
        ) : (
          <>
            <table className="adm-table">
              <tbody>
                {overrides.map((o) => (
                  <tr key={o.key}>
                    <td>
                      {o.kind === 'image'
                        ? <img src={o.url} alt="" className="adm-thumb" />
                        : <span className="tech-label">VIDEO</span>}
                    </td>
                    <td><code>{o.key}</code></td>
                    <td className="adm-note">{o.prompt}</td>
                    <td>
                      <button className="adm-mini-btn" onClick={() => removeOverride(o.key)}>
                        {t('admin.art.resetOne')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="adm-form-actions">
              <button className="btn ghost" onClick={() => clearOverrides()}>
                {t('admin.art.resetAll')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
