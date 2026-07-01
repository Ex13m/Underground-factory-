/**
 * Демо-OAuth: полный UX входа (Google / Apple / GitHub) без реального OAuth.
 * Открытие: bus.emit('auth:open') или заход на /account без user.
 */
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { useI18n } from '../lib/i18n';
import { bus } from '../lib/bus';
import type { AuthProvider, User } from '../lib/types';
import '../styles/account.css';

const HOSTS: Record<AuthProvider, string> = {
  google: 'accounts.google.com',
  apple: 'appleid.apple.com',
  github: 'github.com/login/oauth',
};

const PROFILES: Record<AuthProvider, Omit<User, 'avatar'>> = {
  google: { id: 'g-1', name: 'Валера Дрифтов', email: 'valera.drift@gmail.com', provider: 'google' },
  apple: { id: 'a-1', name: 'Аноним Купертино', email: 'private@icloud.com', provider: 'apple' },
  github: { id: 'gh-1', name: 'carbon_dev', email: 'dev@underground.factory', provider: 'github' },
};

/** SVG-аватар с инициалами на красном, инлайн data-URI */
export function makeAvatar(name: string): string {
  const initials = name
    .split(/[\s_.-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">
  <rect width="128" height="128" fill="#e01b22"/>
  <rect y="112" width="128" height="16" fill="#0a0a09"/>
  <text x="64" y="76" font-family="monospace" font-weight="700" font-size="52" fill="#fff" text-anchor="middle">${initials}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 384 512" aria-hidden>
      <path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden>
      <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.42 7.42 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export function AuthModal() {
  const { t } = useI18n();
  const location = useLocation();
  const user = useAuth((s) => s.user);
  const signIn = useAuth((s) => s.signIn);

  const [open, setOpen] = useState(false);
  const [redirecting, setRedirecting] = useState<AuthProvider | null>(null);

  useEffect(() => bus.on('auth:open', () => setOpen(true)), []);

  // автo-открытие на /account без юзера
  useEffect(() => {
    if (location.pathname === '/account' && !useAuth.getState().user) setOpen(true);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, redirecting]);

  const close = () => {
    if (redirecting) return; // не рвём «редирект» на полпути
    setOpen(false);
  };

  const go = (provider: AuthProvider) => {
    if (redirecting) return;
    setRedirecting(provider);
    setTimeout(() => {
      const profile = PROFILES[provider];
      signIn({ ...profile, avatar: makeAvatar(profile.name) });
      setRedirecting(null);
      setOpen(false);
    }, 1500);
  };

  if (!open || user) return null;

  return (
    <div className="uf-auth-overlay" onClick={close} role="dialog" aria-modal="true" aria-label={t('account.auth.title')}>
      <div className="panel rivets uf-auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="uf-auth-head">
          <span className="tape">{t('account.auth.tape')}</span>
          <button className="uf-x" onClick={close} aria-label={t('account.auth.close')} data-testid="auth-close">✕</button>
        </div>
        <h2 className="stencil">{t('account.auth.title')}</h2>
        <p className="uf-auth-sub">{t('account.auth.subtitle')}</p>

        {redirecting ? (
          <div className="uf-auth-popup" data-testid="auth-redirect">
            <div className="uf-auth-popup-bar">
              <i /><i /><i />
              <span style={{ marginLeft: 6 }}>https://{HOSTS[redirecting]}</span>
            </div>
            <div className="uf-auth-popup-body">
              <div>{t('account.auth.redirect', { host: HOSTS[redirecting] })}</div>
              <div style={{ color: 'var(--steel)', marginTop: 4 }}>{t('account.auth.handshake')}</div>
              <div className="uf-auth-progress"><i /></div>
            </div>
          </div>
        ) : (
          <div className="uf-oauth-list">
            <button className="uf-oauth-btn" onClick={() => go('google')} data-testid="oauth-google">
              <GoogleIcon /> {t('account.auth.google')}
            </button>
            <button className="uf-oauth-btn apple" onClick={() => go('apple')} data-testid="oauth-apple">
              <AppleIcon /> {t('account.auth.apple')}
            </button>
            <button className="uf-oauth-btn github" onClick={() => go('github')} data-testid="oauth-github">
              <GitHubIcon /> {t('account.auth.github')}
            </button>
          </div>
        )}

        <div className="tech-label uf-auth-demo">{t('account.auth.demo')}</div>
      </div>
    </div>
  );
}
