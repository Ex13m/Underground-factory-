/** СЕКЦИЯ C // ИЗБРАННОЕ — мини-карточки залайканных обвесов. */
import { Link } from 'react-router-dom';
import { useAuth } from '../../store/auth';
import { useCatalog } from '../../store/catalog';
import { useI18n } from '../../lib/i18n';
import { Img } from '../../lib/media';
import '../../styles/account.css';

export function FavoritesSection() {
  const { t, lt } = useI18n();
  const favorites = useAuth((s) => s.favorites);
  const toggleFavorite = useAuth((s) => s.toggleFavorite);
  const products = useCatalog((s) => s.products);

  const favs = products.filter((p) => favorites.includes(p.id));

  return (
    <section>
      <div className="uf-acc-sec-head">
        <h2 className="stencil">{t('account.fav.title')}</h2>
        <span className="tech-label">{t('account.fav.label')}</span>
      </div>

      {favs.length === 0 ? (
        <div className="panel uf-sec-empty">
          <h3>{t('account.fav.empty.title')}</h3>
          <p>{t('account.fav.empty.text')}</p>
        </div>
      ) : (
        <div className="uf-fav-grid">
          {favs.map((p) => (
            <div className="panel rivets uf-fav-card" key={p.id} data-testid="fav-card">
              <Link to={`/product/${p.id}`}>
                <Img src={p.media[0]?.url} seed={p.media[0]?.seed ?? p.id} alt={lt(p.name)} />
              </Link>
              <div className="uf-fav-card-body">
                <Link to={`/product/${p.id}`}>
                  <h3 className="stencil">{lt(p.name)}</h3>
                </Link>
                <div className="uf-fav-card-row">
                  <span className="uf-fav-price">${p.price}</span>
                  <button
                    className="uf-x"
                    title={t('account.fav.remove')}
                    aria-label={t('account.fav.remove')}
                    onClick={() => toggleFavorite(p.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
