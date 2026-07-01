/** Вкладка ОБМЕН: экспорт/импорт catalog.json + витрина интеграций UF_API. */

import { useState } from 'react';
import { api } from '../../lib/api';
import { useI18n } from '../../lib/i18n';

const SNIPPET = "window.UF_API.rest('GET', '/catalog')";

export function ExchangeTab() {
  const { t } = useI18n();
  const [importText, setImportText] = useState('');
  const [report, setReport] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const doExport = () => {
    const blob = new Blob([api.exportCatalog()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'catalog.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const doImport = () => {
    try {
      const { products, cars } = api.importCatalog(importText);
      setReport({ ok: true, text: t('admin.exch.importOk', { p: products, c: cars }) });
      setImportText('');
    } catch {
      setReport({ ok: false, text: t('admin.exch.importErr') });
    }
  };

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(SNIPPET);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard заблокирован — ничего страшного, сниппет перед глазами */
    }
  };

  return (
    <div className="adm-section">
      <div className="adm-exch">
        <div className="panel rivets">
          <div className="adm-block-title">
            <span className="tape dark">{t('admin.exch.exportTitle')}</span>
          </div>
          <p className="adm-note">{t('admin.exch.exportText')}</p>
          <button className="btn" onClick={doExport}>
            {t('admin.exch.exportBtn')}
          </button>
        </div>

        <div className="panel rivets">
          <div className="adm-block-title">
            <span className="tape hazard">{t('admin.exch.importTitle')}</span>
          </div>
          <p className="adm-note">{t('admin.exch.importWarn')}</p>
          <textarea
            className="field adm-import"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={t('admin.exch.importPh')}
          />
          <div className="adm-form-actions">
            <button className="btn dark" onClick={doImport} disabled={!importText.trim()}>
              {t('admin.exch.importBtn')}
            </button>
          </div>
          {report && <div className={`adm-report${report.ok ? '' : ' err'}`}>{report.text}</div>}
        </div>
      </div>

      <div className="panel">
        <div className="adm-block-title">
          <h2 className="stencil">{t('admin.exch.intTitle')}</h2>
        </div>
        <p className="adm-note">{t('admin.exch.intText')}</p>
        <div className="adm-snippet">
          <code>
            <span className="kw">window</span>.UF_API.rest(<span className="kw">'GET'</span>, '/catalog')
          </code>
          <button className="adm-mini-btn" onClick={copySnippet}>
            {copied ? t('admin.exch.copied') : t('admin.exch.copy')}
          </button>
        </div>
        <a className="btn ghost" href="API.md" target="_blank" rel="noreferrer">
          {t('admin.exch.apidoc')}
        </a>
      </div>
    </div>
  );
}
