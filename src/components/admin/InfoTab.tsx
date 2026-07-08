/**
 * Вкладка ИНФО: паспорт сайта — версия, статусы работ, технологии,
 * связи, модели генерации и остаток кредитов Higgsfield.
 * Данные — src/data/siteinfo.ts (обновляются вместе с релизами).
 */

import { useI18n } from '../../lib/i18n';
import { GEN_MODELS, HF_CREDITS, SITE_INFO } from '../../data/siteinfo';

export function InfoTab() {
  const { t, lt } = useI18n();

  return (
    <div className="adm-section">
      <div className="panel rivets">
        <div className="adm-block-title">
          <span className="tape">{t('admin.info.version')}</span>
          <h2 className="stencil">v{__APP_VERSION__}</h2>
          <span className="tech-label">BUILD {__BUILD_DATE__}</span>
        </div>
        <p className="adm-note">
          <a
            href="https://github.com/Ex13m/Underground-factory-/blob/claude/car-tuning-shop-z39a5s/CHANGELOG.md"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--blood)' }}
          >
            CHANGELOG ▸ {t('admin.info.changelog')}
          </a>
        </p>
      </div>

      {SITE_INFO.map((sec, i) => (
        <div key={i} className="panel">
          <div className="adm-block-title">
            <span className="tape dark">{lt(sec.title)}</span>
          </div>
          <ul className="adm-note" style={{ paddingLeft: 18, display: 'grid', gap: 6 }}>
            {sec.items.map((it, j) => (
              <li key={j}>{lt(it)}</li>
            ))}
          </ul>
        </div>
      ))}

      <div className="panel rivets">
        <div className="adm-block-title">
          <span className="tape hazard">{t('admin.info.models')}</span>
        </div>
        <table className="adm-table">
          <tbody>
            {GEN_MODELS.map((m) => (
              <tr key={m.model}>
                <td style={{ whiteSpace: 'nowrap', color: 'var(--blood)', fontWeight: 700 }}>{m.model}</td>
                <td className="adm-note">{lt(m.usage)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <div className="adm-block-title">
          <span className="tape">HIGGSFIELD</span>
          <span className="tech-label">
            {t('admin.info.credits')}: <b style={{ color: 'var(--blood)' }}>{HF_CREDITS.value}</b>
            {' '}({HF_CREDITS.plan}, {t('admin.info.measured')} {HF_CREDITS.measuredAt})
          </span>
        </div>
        <div className="adm-form-actions">
          <a className="btn ghost" href="https://higgsfield.ai" target="_blank" rel="noreferrer">
            higgsfield.ai ▸
          </a>
          <a className="btn ghost" href="https://cloud.higgsfield.ai" target="_blank" rel="noreferrer">
            cloud.higgsfield.ai (API) ▸
          </a>
        </div>
      </div>
    </div>
  );
}
