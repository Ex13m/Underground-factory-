/** Вкладка ЗАКАЗЫ: read-only журнал api.listOrders(). */

import { useEffect, useState } from 'react';
import { api, onDataChanged } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import { ORDER_STATUS_META } from '../../lib/types';

export function OrdersTab() {
  const { t, lt, lang } = useI18n();
  const [orders, setOrders] = useState(() => api.listOrders());

  useEffect(() => onDataChanged(() => setOrders(api.listOrders())), []);

  return (
    <div className="adm-section">
      <div className="panel">
        <div className="adm-block-title">
          <h2 className="stencil">{t('admin.orders.title')}</h2>
          <span className="tech-label">{t('admin.products.count', { n: orders.length })}</span>
        </div>
        {orders.length === 0 ? (
          <div className="adm-empty">{t('admin.orders.empty')}</div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t('admin.col.date')}</th>
                  <th className="adm-num">{t('admin.col.items')}</th>
                  <th className="adm-num">{t('admin.col.total')}</th>
                  <th>{t('admin.col.status')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {new Date(o.createdAt).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')}
                    </td>
                    <td className="adm-num">{o.items.reduce((s, it) => s + it.qty, 0)}</td>
                    <td className="adm-num">
                      {t('common.currency')}
                      {o.total}
                    </td>
                    <td>{lt(ORDER_STATUS_META[o.status])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
