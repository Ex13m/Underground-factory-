import { useI18n } from '../lib/i18n';

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="uf-footer">
      <div className="hazard-stripe" />
      <div className="container uf-footer-row">
        <div>
          <div className="stencil" style={{ fontSize: 18 }}>UNDERGROUND FACTORY</div>
          <div className="tech-label">{t('common.footer.tagline')}</div>
        </div>
        <div className="barcode" aria-hidden />
        <div className="tech-label" style={{ marginLeft: 'auto', textAlign: 'right' }}>
          {t('common.footer.integrations')}
          <br />
          {t('common.footer.disclaimer')}
          <br />
          © {new Date().getFullYear()} <b style={{ color: 'var(--paper)' }}>Gausse Holler Custom Lab</b>
          <br />
          <a
            href="https://github.com/Ex13m/Underground-factory-/blob/claude/car-tuning-shop-z39a5s/CHANGELOG.md"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--blood)' }}
            data-testid="site-version"
          >
            v{__APP_VERSION__} ▸ BUILD {__BUILD_DATE__} ▸ CHANGELOG
          </a>
        </div>
      </div>
    </footer>
  );
}
