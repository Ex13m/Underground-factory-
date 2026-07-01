/** Вкладка ПРОМО: список промокодов + регистрация новых (source: 'admin'). */

import { useEffect, useState } from 'react';
import { api, onDataChanged } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import { posNum } from './util';

export function PromosTab() {
  const { t } = useI18n();
  const [promos, setPromos] = useState(() => api.listPromos());
  const [code, setCode] = useState('');
  const [pct, setPct] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => onDataChanged(() => setPromos(api.listPromos())), []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!code.trim()) errs.code = 'admin.err.required';
    const p = posNum(pct);
    if (Number.isNaN(p) || p > 100) errs.pct = 'admin.err.pct';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    api.registerPromo({ code: code.trim().toUpperCase(), pct: p, source: 'admin' });
    setCode('');
    setPct('');
    setErrors({});
  };

  return (
    <div className="adm-section">
      <div className="panel">
        <div className="adm-block-title">
          <h2 className="stencil">{t('admin.promos.title')}</h2>
          <span className="tech-label">{t('admin.products.count', { n: promos.length })}</span>
        </div>
        {promos.length === 0 ? (
          <div className="adm-empty">{t('admin.promos.empty')}</div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table" style={{ minWidth: 420 }}>
              <thead>
                <tr>
                  <th>{t('admin.col.code')}</th>
                  <th className="adm-num">{t('admin.col.pct')}</th>
                  <th>{t('admin.col.source')}</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((p) => (
                  <tr key={p.code}>
                    <td style={{ color: 'var(--hazard)' }}>{p.code}</td>
                    <td className="adm-num">−{p.pct}%</td>
                    <td>{p.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel rivets adm-form">
        <div className="adm-block-title">
          <span className="tape">{t('admin.promos.addTitle')}</span>
        </div>
        <form onSubmit={submit} noValidate>
          <div className="adm-grid">
            <div className="adm-fld">
              <label htmlFor="pr-code">{t('admin.f.code')}</label>
              <input
                id="pr-code"
                className={`field${errors.code ? ' invalid' : ''}`}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="WETCARDBOARD10"
              />
              {errors.code && <span className="adm-err">{t(errors.code)}</span>}
            </div>
            <div className="adm-fld">
              <label htmlFor="pr-pct">{t('admin.f.pct')}</label>
              <input
                id="pr-pct"
                className={`field${errors.pct ? ' invalid' : ''}`}
                inputMode="numeric"
                value={pct}
                onChange={(e) => setPct(e.target.value)}
                placeholder="10"
              />
              {errors.pct && <span className="adm-err">{t(errors.pct)}</span>}
            </div>
          </div>
          <div className="adm-form-actions">
            <button type="submit" className="btn">
              {t('admin.promos.submit')}
            </button>
            <span className="adm-note" style={{ margin: 0 }}>
              {t('admin.promos.note')}
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
