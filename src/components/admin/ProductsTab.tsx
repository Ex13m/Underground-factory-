/** Вкладка ОБВЕСЫ: таблица каталога + форма добавления/правки. */

import { useRef, useState } from 'react';
import { api } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import { Img } from '../../lib/media';
import { GRADE_META } from '../../lib/types';
import type { Product } from '../../lib/types';
import { useCatalog } from '../../store/catalog';
import { ProductForm } from './ProductForm';

export function ProductsTab() {
  const { t, lt } = useI18n();
  const products = useCatalog((s) => s.products);
  const cars = useCatalog((s) => s.cars);
  const [editing, setEditing] = useState<Product | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const startEdit = (p: Product) => {
    setEditing(p);
    window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  };

  const remove = (p: Product) => {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    api.deleteProduct(p.id);
    if (editing?.id === p.id) setEditing(null);
  };

  return (
    <div className="adm-section">
      <div className="panel">
        <div className="adm-block-title">
          <h2 className="stencil">{t('admin.products.title')}</h2>
          <span className="tech-label">{t('admin.products.count', { n: products.length })}</span>
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>{t('admin.col.sku')}</th>
                <th>{t('admin.col.media')}</th>
                <th>{t('admin.col.name')}</th>
                <th className="adm-num">{t('admin.col.price')}</th>
                <th className="adm-num">{t('admin.col.weight')}</th>
                <th>{t('admin.col.rarity')}</th>
                <th>{t('admin.col.hit')}</th>
                <th style={{ textAlign: 'right' }}>{t('admin.col.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const meta = GRADE_META[p.rarity];
                const first = p.media[0];
                return (
                  <tr key={p.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {p.sku}
                      {p.custom && (
                        <>
                          {' '}
                          <span className="adm-badge">{t('admin.badge.custom')}</span>
                        </>
                      )}
                    </td>
                    <td>
                      <Img className="adm-thumb" src={first?.url} seed={first?.seed ?? p.id} alt={lt(p.name)} />
                    </td>
                    <td>{p.name.ru}</td>
                    <td className="adm-num">
                      {t('common.currency')}
                      {p.price}
                    </td>
                    <td className="adm-num">
                      {p.weightGrams} {t('common.grams')}
                    </td>
                    <td>
                      <span className={`rarity ${meta.glow ? 'glow' : ''}`} style={{ color: meta.color }}>
                        {lt(meta.label)}
                      </span>
                    </td>
                    <td>{p.hit && <span className="adm-badge hit">{t('admin.badge.hit')}</span>}</td>
                    <td>
                      <div className="adm-actions">
                        <button className="adm-mini-btn" onClick={() => startEdit(p)}>
                          {t('admin.edit')}
                        </button>
                        <button className="adm-mini-btn danger" onClick={() => remove(p)}>
                          {t('common.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div ref={formRef}>
        <ProductForm
          key={editing?.id ?? 'new'}
          cars={cars}
          initial={editing}
          onDone={() => setEditing(null)}
        />
      </div>
    </div>
  );
}
