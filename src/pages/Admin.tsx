/**
 * ADMIN — служебное помещение UNDERGROUND FACTORY.
 * Вкладки: ЦЕХ / ОБВЕСЫ / ТАЧКИ / ЗАКАЗЫ / ПРОМО / МАТЕРИАЛЫ / ОБМЕН / АРТ.
 * Всё через api (lib/api.ts); стор каталога обновляется сам (onDataChanged).
 */

import { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { Tabs } from '../components/admin/Tabs';
import { TreeTab } from '../components/admin/TreeTab';
import { ProductsTab } from '../components/admin/ProductsTab';
import { CarsTab } from '../components/admin/CarsTab';
import { OrdersTab } from '../components/admin/OrdersTab';
import { PromosTab } from '../components/admin/PromosTab';
import { MaterialsTab } from '../components/admin/MaterialsTab';
import { ExchangeTab } from '../components/admin/ExchangeTab';
import { ArtTab } from '../components/admin/ArtTab';
import '../styles/admin.css';

type TabId = 'tree' | 'products' | 'cars' | 'orders' | 'promos' | 'materials' | 'exchange' | 'art';

export function Admin() {
  const { t } = useI18n();
  const [tab, setTab] = useState<TabId>('products');
  // кодовый замок служебного помещения (прототип: код в сессии браузера)
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('uf:admin-ok') === '1');
  const [code, setCode] = useState('');
  const [codeErr, setCodeErr] = useState(false);

  const tryUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === '4174') {
      sessionStorage.setItem('uf:admin-ok', '1');
      setUnlocked(true);
    } else {
      setCodeErr(true);
      setCode('');
    }
  };

  if (!unlocked) {
    return (
      <div className="page">
        <div className="hazard-stripe yellow" />
        <div className="container" style={{ maxWidth: 440, paddingTop: 80 }}>
          <div className="panel rivets" style={{ padding: 28 }}>
            <span className="tape hazard">{t('admin.tape')}</span>
            <h1 className="stencil" style={{ fontSize: 30, margin: '14px 0 6px' }}>
              {t('admin.lock.title')}
            </h1>
            <p className="adm-sub" style={{ marginBottom: 18 }}>{t('admin.lock.hint')}</p>
            <form onSubmit={tryUnlock} noValidate>
              <input
                className="field"
                type="password"
                inputMode="numeric"
                autoFocus
                value={code}
                placeholder="▸ ▸ ▸ ▸"
                onChange={(e) => { setCode(e.target.value); setCodeErr(false); }}
                data-testid="admin-code"
              />
              {codeErr && <span className="adm-err">{t('admin.lock.err')}</span>}
              <div style={{ marginTop: 14 }}>
                <button type="submit" className="btn" data-testid="admin-unlock">
                  {t('admin.lock.btn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'tree', label: t('admin.tab.tree') },
    { id: 'products', label: t('admin.tab.products') },
    { id: 'cars', label: t('admin.tab.cars') },
    { id: 'orders', label: t('admin.tab.orders') },
    { id: 'promos', label: t('admin.tab.promos') },
    { id: 'materials', label: t('admin.tab.materials') },
    { id: 'exchange', label: t('admin.tab.exchange') },
    { id: 'art', label: t('admin.tab.art') },
  ];

  return (
    <div className="page">
      <div className="hazard-stripe yellow" />
      <div className="container">
        <header className="adm-head">
          <div className="adm-head-row">
            <span className="tape hazard">{t('admin.tape')}</span>
            <span className="barcode" aria-hidden />
          </div>
          <h1 className="stencil">
            <span className="glitch auto" data-text={t('admin.title')}>{t('admin.title')}</span>
          </h1>
          <p className="adm-sub">{t('admin.sub')}</p>
        </header>

        <Tabs tabs={tabs} active={tab} onChange={(id) => setTab(id as TabId)} />

        {tab === 'tree' && <TreeTab />}
        {tab === 'products' && <ProductsTab />}
        {tab === 'cars' && <CarsTab />}
        {tab === 'orders' && <OrdersTab />}
        {tab === 'promos' && <PromosTab />}
        {tab === 'materials' && <MaterialsTab />}
        {tab === 'exchange' && <ExchangeTab />}
        {tab === 'art' && <ArtTab />}
      </div>
    </div>
  );
}
