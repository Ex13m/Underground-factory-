import { useEffect } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { I18nProvider, useI18n } from './lib/i18n';
import { useUI } from './store/ui';
import { bus } from './lib/bus';

import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { ProductPage } from './pages/ProductPage';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { Account } from './pages/Account';
import { Admin } from './pages/Admin';

import { AuthModal } from './components/AuthModal';
import { ArtEditor } from './fx/ArtEditor';
import { UpdatesTicker } from './fx/UpdatesTicker';
import { CursorFX } from './fx/CursorFX';
import { BootIntro } from './fx/BootIntro';
import { Bot } from './bot/Bot';
import { Coachmarks } from './bot/Coachmarks';

function NotFound() {
  const { t } = useI18n();
  return (
    <div className="page container" style={{ paddingTop: 100, textAlign: 'center' }}>
      <div className="tape">FATAL ERROR</div>
      <h1 className="stencil" style={{ fontSize: 'clamp(40px, 9vw, 120px)', color: 'var(--blood)' }}>
        {t('common.notfound.title')}
      </h1>
      <p className="tech-label" style={{ marginBottom: 30 }}>{t('common.notfound.text')}</p>
      <Link to="/" className="btn">{t('common.notfound.home')}</Link>
    </div>
  );
}

function Shell() {
  const location = useLocation();
  const calm = useUI((s) => s.calm);

  useEffect(() => {
    bus.emit('page:change', { path: location.pathname });
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle('calm', calm);
  }, [calm]);

  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/account" element={<Account />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <AuthModal />
      <ArtEditor />
      <UpdatesTicker />
      <BootIntro />
      <CursorFX />
      <Bot />
      <Coachmarks />
      <div className="noise" aria-hidden />
    </>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <Shell />
    </I18nProvider>
  );
}
