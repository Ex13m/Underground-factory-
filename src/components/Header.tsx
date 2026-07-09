import { NavLink, Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { useUI } from '../store/ui';
import { useAuth } from '../store/auth';
import { useCart, cartCount } from '../store/cart';
import { bus } from '../lib/bus';
import { HF_CREDITS } from '../data/siteinfo';

export function Header() {
  const { t } = useI18n();
  const { lang, setLang, calm, toggleCalm } = useUI();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const items = useCart((s) => s.items);

  return (
    <header className="uf-header">
      <div className="container uf-header-row">
        <Link to="/" className="uf-logo" data-hint="logo">
          <div className="uf-logo-mark" />
          <div className="uf-logo-text">
            UNDERGROUND<br />FACTORY
            <small>CARBON DIV. // 軽量</small>
          </div>
        </Link>

        <nav className="uf-nav">
          <NavLink to="/catalog" data-hint="nav-catalog">{t('common.nav.catalog')}</NavLink>
          <NavLink to="/account" data-hint="nav-account">{t('common.nav.account')}</NavLink>
          <NavLink to="/tv">{t('common.nav.tv')}</NavLink>
          <NavLink to="/admin" className="uf-nav-admin">{t('common.nav.admin')}</NavLink>
          {/* расход кредитов Higgsfield на проект: «служебная дверь», как админка —
              видна при наведении; данные из биллинга, обновляются с релизами */}
          <NavLink to="/admin" className="uf-nav-admin uf-nav-tokens mono" title={t('common.tokens.title')}>
            ⛽ {HF_CREDITS.spent}
          </NavLink>
        </nav>

        <div className="uf-header-actions">
          <button
            className="hdr-btn"
            onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')}
            title="RU / EN"
            data-testid="lang-switch"
          >
            {lang === 'ru' ? 'EN' : 'RU'}
          </button>
          <button className="hdr-btn" onClick={toggleCalm} title="FX" data-testid="fx-switch">
            {calm ? t('common.fx.off') : t('common.fx.on')}
          </button>
          <Link to="/cart" className="hdr-btn" data-testid="cart-link" data-hint="cart">
            {t('common.nav.cart')} <span className="count">[{cartCount(items)}]</span>
          </Link>
          {user ? (
            <button className="hdr-btn" onClick={signOut} title={t('common.signout')} data-testid="signout">
              {user.name.split(' ')[0]} ✕
            </button>
          ) : (
            <button className="hdr-btn primary" onClick={() => bus.emit('auth:open')} data-testid="signin">
              {t('common.signin')}
            </button>
          )}
        </div>
      </div>
      <div className="marquee" aria-hidden>
        <div className="marquee-inner">
          {`${t('common.marquee')} `.repeat(4)}
        </div>
      </div>
    </header>
  );
}
