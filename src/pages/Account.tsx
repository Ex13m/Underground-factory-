/**
 * PHASE—03 // GARAGE SECTOR — личный кабинет.
 * Профиль + гараж (car-first) + заказы с живым трекером + избранное.
 */
import { useAuth } from '../store/auth';
import { useI18n } from '../lib/i18n';
import { bus } from '../lib/bus';
import { makeAvatar } from '../components/AuthModal';
import { GarageSection } from '../components/account/GarageSection';
import { OrdersSection } from '../components/account/OrdersSection';
import { FavoritesSection } from '../components/account/FavoritesSection';
import '../styles/account.css';

/** детерминированный PILOT ID из user.id */
function pilotId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 0x10000).toString(16).toUpperCase().padStart(4, '0');
}

export function Account() {
  const { t } = useI18n();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);

  if (!user) {
    return (
      <div className="page container">
        <div className="uf-empty">
          <span className="tape">{t('account.invite.tape')}</span>
          <h1 className="stencil glitch" data-text={t('account.invite.title')}>{t('account.invite.title')}</h1>
          <p>{t('account.invite.text')}</p>
          <button className="btn" onClick={() => bus.emit('auth:open')} data-testid="account-signin">
            {t('account.invite.cta')} ▸
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page container">
      <div className="uf-page-head">
        <span className="tech-label">{t('account.phase')}</span>
        <h1 className="stencil">{t('account.title')}</h1>
      </div>

      <div className="uf-acc-sections">
        <div className="panel rivets uf-acc-profile">
          <img className="uf-acc-avatar" src={user.avatar ?? makeAvatar(user.name)} alt={user.name} />
          <div className="uf-acc-profile-info">
            <span className="tech-label">{t('account.pilot', { id: pilotId(user.id) })}</span>
            <h2 className="stencil">{user.name}</h2>
            <span className="mail">{user.email}</span>
          </div>
          <div className="uf-acc-profile-side">
            <span className="tape dark">{t('account.provider')} ▸ {user.provider.toUpperCase()}</span>
            <button className="btn ghost" style={{ padding: '9px 18px', fontSize: 12 }} onClick={signOut} data-testid="account-signout">
              {t('account.signout')} ✕
            </button>
          </div>
        </div>

        <GarageSection />
        <div className="hazard-stripe" aria-hidden />
        <OrdersSection />
        <div className="hazard-stripe yellow" aria-hidden />
        <FavoritesSection />
      </div>
    </div>
  );
}
