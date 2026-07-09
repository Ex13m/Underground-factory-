/**
 * GDPR: плашка согласия + модалка с политикой данных.
 * Сайт — прототип без аналитики и рекламы: localStorage/IndexedDB хранят
 * только функциональное (корзина, гараж, настройки, правки админа).
 * Право на удаление — кнопка «Стереть мои данные» (чистит всё локальное).
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../lib/i18n';
import { bus } from '../lib/bus';
import '../styles/gdpr.css';

const LS_KEY = 'uf:gdpr';

export function GdprBanner() {
  const { t } = useI18n();
  const [accepted, setAccepted] = useState(() => localStorage.getItem(LS_KEY) === 'accepted');
  const [policyOpen, setPolicyOpen] = useState(false);
  const [wiped, setWiped] = useState(false);

  // политику можно открыть из любого места сайта (окно входа и т.п.)
  useEffect(() => bus.on('gdpr:open', () => setPolicyOpen(true)), []);

  const accept = () => {
    localStorage.setItem(LS_KEY, 'accepted');
    setAccepted(true);
  };

  // право на забвение: сносим всё локальное хранилище сайта
  const wipe = async () => {
    localStorage.clear();
    sessionStorage.clear();
    try {
      await new Promise((res) => {
        const req = indexedDB.deleteDatabase('uf-media');
        req.onsuccess = req.onerror = req.onblocked = () => res(null);
      });
    } catch { /* нет базы — нечего удалять */ }
    setWiped(true);
    window.setTimeout(() => window.location.reload(), 1200);
  };

  // портал в body: никакой transform/filter у предков не превратит
  // position:fixed в «прилипший к контенту» — баннер всегда плавает над футером
  return createPortal(
    <>
      {!accepted && (
        <div
          className="gdpr panel"
          role="dialog"
          aria-label="GDPR"
          data-testid="gdpr"
          style={{ position: 'fixed', right: 14, bottom: 14 }}
        >
          <span className="tape dark">GDPR</span>
          <p className="gdpr-text">{t('gdpr.text')}</p>
          <div className="gdpr-actions">
            <button className="btn" onClick={accept} data-testid="gdpr-accept">
              {t('gdpr.accept')}
            </button>
            <button className="btn ghost" onClick={() => setPolicyOpen(true)}>
              {t('gdpr.policy')}
            </button>
          </div>
        </div>
      )}

      {policyOpen && (
        <div className="uf-auth-overlay" onClick={() => setPolicyOpen(false)}>
          <div className="gdpr-modal panel rivets" onClick={(e) => e.stopPropagation()}>
            <div className="artedit-head" style={{ cursor: 'default' }}>
              <span className="tech-label">{t('gdpr.policy.title')}</span>
              <button className="artedit-x" onClick={() => setPolicyOpen(false)}>✕</button>
            </div>
            <div className="gdpr-modal-body">
              <p>{t('gdpr.policy.controller')}</p>
              <p>{t('gdpr.policy.what')}</p>
              <p>{t('gdpr.policy.no')}</p>
              <p>{t('gdpr.policy.third')}</p>
              <p>{t('gdpr.policy.rights')}</p>
              <p>{t('gdpr.policy.erase')}</p>
            </div>
            <div className="gdpr-actions">
              <button className="btn dark" onClick={wipe} data-testid="gdpr-wipe">
                {wiped ? t('gdpr.wiped') : t('gdpr.wipe')}
              </button>
              <button className="btn ghost" onClick={() => setPolicyOpen(false)}>
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* постоянная точка входа в политику — маленькая кнопка в футере не нужна:
          ссылка живёт в самом баннере до согласия; после — через кнопку ниже */}
      {accepted && (
        <button
          className="gdpr-mini mono"
          onClick={() => setPolicyOpen(true)}
          title={t('gdpr.policy.title')}
        >
          GDPR
        </button>
      )}
    </>,
    document.body,
  );
}
