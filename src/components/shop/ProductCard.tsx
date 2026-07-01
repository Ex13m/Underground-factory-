import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../lib/types';
import { GRADE_META } from '../../lib/types';
import { useI18n } from '../../lib/i18n';
import { useCart } from '../../store/cart';
import { useAuth } from '../../store/auth';
import { Img } from '../../lib/media';
import '../../styles/shop.css';

export function ProductCard({ product }: { product: Product }) {
  const { t, lt } = useI18n();
  const add = useCart((s) => s.add);
  const favorites = useAuth((s) => s.favorites);
  const toggleFavorite = useAuth((s) => s.toggleFavorite);
  const [flying, setFlying] = useState(false);
  const flyTimer = useRef<number>();

  const meta = GRADE_META[product.rarity];
  const fav = favorites.includes(product.id);
  const media = product.media[0];

  const onAdd = () => {
    add(product.id);
    setFlying(false);
    // рестарт анимации «улетело»
    requestAnimationFrame(() => setFlying(true));
    window.clearTimeout(flyTimer.current);
    flyTimer.current = window.setTimeout(() => setFlying(false), 750);
  };

  return (
    <article className="pcard panel rivets">
      <Link to={`/product/${product.id}`} className="pcard-media">
        <Img src={media?.url} seed={media?.seed ?? `card-${product.id}`} alt={lt(product.name)} />
        <span className={`rarity${meta.glow ? ' glow' : ''}`} style={{ color: meta.color }}>
          {lt(meta.label)}
        </span>
        <span className="pcard-sku mono">{product.sku}</span>
      </Link>
      <button
        type="button"
        className={`pcard-fav${fav ? ' on' : ''}`}
        onClick={() => toggleFavorite(product.id)}
        aria-label={t(fav ? 'catalog.card.unfav' : 'catalog.card.fav')}
        title={t(fav ? 'catalog.card.unfav' : 'catalog.card.fav')}
      >
        ♥
      </button>
      <div className="pcard-body">
        <Link to={`/product/${product.id}`} className="pcard-name glitch" data-text={lt(product.name)}>
          {lt(product.name)}
        </Link>
        <div className="pcard-stats">
          <div className="pcard-weight">
            {product.weightGrams}
            <small>{t('common.grams')}</small>
          </div>
          <div className="pcard-heat">{t('common.heat', { n: product.heatC })}</div>
        </div>
        <div className="pcard-actions">
          <div className="pcard-price">
            {t('common.currency')}
            {product.price}
          </div>
          <button type="button" className={`pcard-add${flying ? ' flying' : ''}`} onClick={onAdd}>
            {t('catalog.card.add')}
            <span className="fly-chip" aria-hidden>
              ▣
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}
