/**
 * Вкладка АРТ: включение арт-редактора (правка картинок промптом прямо на сайте),
 * ключи API генераторов и список текущих замен со сбросом.
 */

import { useEffect, useState } from 'react';
import { api, onDataChanged } from '../../lib/api';
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
  const [queue, setQueue] = useState(api.listGenQueue());
  const [replStatus, setReplStatus] = useState<'idle' | 'testing' | 'ok' | 'bad'>('idle');

  /** живой тест ключа Replicate через нашу функцию /api/generate?ping */
  const testReplicate = async () => {
    const k = readGenKeys().replicate?.trim();
    if (!k || replStatus === 'testing') return;
    setReplStatus('testing');
    try {
      const res = await fetch('/api/generate?ping=1', { headers: { 'x-replicate-key': k } });
      setReplStatus(res.ok ? 'ok' : 'bad');
    } catch {
      setReplStatus('bad');
    }
  };

  useEffect(() => onMediaChanged(() => setOverrides(listOverrides())), []);
  useEffect(() => onDataChanged(() => setQueue(api.listGenQueue())), []);

  const downloadQueue = () => {
    const blob = new Blob([JSON.stringify(queue, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gen-queue.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

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
        <p className="adm-note">{t('admin.art.replText')}</p>
        <label className="tech-label" htmlFor="art-key-replicate">REPLICATE ▸ r8_…</label>
        <div className="adm-form-actions" style={{ alignItems: 'center' }}>
          <input
            id="art-key-replicate"
            className="field"
            style={{ flex: 1, minWidth: 220 }}
            type="password"
            placeholder="r8_…"
            value={keys.replicate ?? ''}
            onChange={(e) => {
              setReplStatus('idle');
              saveKey({ replicate: e.target.value.trim() || undefined });
            }}
            data-testid="art-key-replicate"
          />
          <button
            className="btn ghost"
            onClick={() => void testReplicate()}
            disabled={!keys.replicate || replStatus === 'testing'}
          >
            {replStatus === 'testing' ? t('art.key.testing') : t('art.key.test')}
          </button>
          <span
            className="tech-label"
            style={replStatus === 'ok' ? { color: '#46c85a' } : replStatus === 'bad' ? { color: 'var(--blood)' } : undefined}
          >
            {replStatus === 'ok'
              ? t('art.key.ok')
              : replStatus === 'bad'
                ? t('art.key.bad')
                : keys.replicate
                  ? t('art.key.saved')
                  : t('art.key.note')}
          </span>
        </div>

        <label className="tech-label" style={{ marginTop: 12, display: 'block' }}>
          {t('admin.art.defProvider')}
        </label>
        <div className="adm-form-actions">
          <button
            className={`btn ${(keys.provider ?? 'pollinations') === 'pollinations' ? '' : 'ghost'}`}
            onClick={() => saveKey({ provider: 'pollinations' as GenProvider })}
          >
            {t('art.free')}
          </button>
          <button
            className={`btn ${keys.provider === 'openai' ? '' : 'ghost'}`}
            onClick={() => saveKey({ provider: 'openai' as GenProvider })}
          >
            GPT IMAGE
          </button>
          <button
            className={`btn ${keys.provider === 'gemini' ? '' : 'ghost'}`}
            onClick={() => saveKey({ provider: 'gemini' as GenProvider })}
          >
            NANO BANANA
          </button>
        </div>

        {/* отдельный ключ Gemini — только для «Опознать по фото» в рилсах */}
        <label className="tech-label" htmlFor="art-key-gemini" style={{ marginTop: 12, display: 'block' }}>
          GEMINI (AIza…) ▸ {t('admin.art.geminiHint')}
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
      </div>

      <div className="panel rivets">
        <div className="adm-block-title">
          <span className="tape">{t('admin.art.queueTitle', { n: queue.length })}</span>
        </div>
        <p className="adm-note">{t('admin.art.queueText')}</p>
        {queue.length > 0 && (
          <>
            <table className="adm-table">
              <tbody>
                {queue.map((q) => (
                  <tr key={q.key}>
                    <td><code>{q.key}</code></td>
                    <td className="adm-note">{q.prompt}</td>
                    <td className="adm-num">{q.width}×{q.height}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="adm-form-actions">
              <button className="btn dark" onClick={downloadQueue}>{t('admin.art.queueExport')}</button>
              <button className="btn ghost" onClick={() => api.clearGenQueue()}>{t('admin.art.queueClear')}</button>
            </div>
          </>
        )}
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
