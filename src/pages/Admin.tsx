/**
 * ADMIN — служебное помещение UNDERGROUND FACTORY.
 * Вкладки: ОБВЕСЫ / ТАЧКИ / ЗАКАЗЫ / ПРОМО / ОБМЕН.
 * Всё через api (lib/api.ts); стор каталога обновляется сам (onDataChanged).
 */

import { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { Tabs } from '../components/admin/Tabs';
import { ProductsTab } from '../components/admin/ProductsTab';
import { CarsTab } from '../components/admin/CarsTab';
import { OrdersTab } from '../components/admin/OrdersTab';
import { PromosTab } from '../components/admin/PromosTab';
import { ExchangeTab } from '../components/admin/ExchangeTab';
import { ArtTab } from '../components/admin/ArtTab';
import '../styles/admin.css';

type TabId = 'products' | 'cars' | 'orders' | 'promos' | 'exchange' | 'art';

export function Admin() {
  const { t } = useI18n();
  const [tab, setTab] = useState<TabId>('products');

  const tabs = [
    { id: 'products', label: t('admin.tab.products') },
    { id: 'cars', label: t('admin.tab.cars') },
    { id: 'orders', label: t('admin.tab.orders') },
    { id: 'promos', label: t('admin.tab.promos') },
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
          <h1 className="stencil">{t('admin.title')}</h1>
          <p className="adm-sub">{t('admin.sub')}</p>
        </header>

        <Tabs tabs={tabs} active={tab} onChange={(id) => setTab(id as TabId)} />

        {tab === 'products' && <ProductsTab />}
        {tab === 'cars' && <CarsTab />}
        {tab === 'orders' && <OrdersTab />}
        {tab === 'promos' && <PromosTab />}
        {tab === 'exchange' && <ExchangeTab />}
        {tab === 'art' && <ArtTab />}
      </div>
    </div>
  );
}
