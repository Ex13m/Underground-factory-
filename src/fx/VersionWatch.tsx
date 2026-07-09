/**
 * Сторож версии: сравнивает вшитую __APP_VERSION__ с /version.json на сервере
 * (маяк пишется при каждой сборке). Проверка: при загрузке, при возврате во
 * вкладку и раз в минуту. Нашёл свежее — показывает плашку «ОБНОВЛЕНИЕ vX»
 * и сам перезагружает сайт: не нужно открывать ссылку заново.
 */

import { useEffect, useState } from 'react';
import { useI18n } from '../lib/i18n';
import '../styles/version.css';

const CHECK_MS = 60_000;

export function VersionWatch() {
  const { t } = useI18n();
  const [fresh, setFresh] = useState<string | null>(null);

  useEffect(() => {
    let dead = false;

    const check = async () => {
      try {
        const r = await fetch(`/version.json?ts=${Date.now()}`, { cache: 'no-store' });
        if (!r.ok) return;
        const data = (await r.json()) as { version?: string };
        if (!dead && data.version && data.version !== __APP_VERSION__) {
          setFresh(data.version);
        }
      } catch {
        /* локальный dev без маяка или сеть — молчим */
      }
    };

    void check();
    const iv = window.setInterval(() => void check(), CHECK_MS);
    const onFocus = () => void check();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      dead = true;
      window.clearInterval(iv);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  // свежая версия найдена: плашка + авто-перезагрузка через пару секунд
  useEffect(() => {
    if (!fresh) return;
    const tm = window.setTimeout(() => window.location.reload(), 2800);
    return () => window.clearTimeout(tm);
  }, [fresh]);

  if (!fresh) return null;
  return (
    <div className="ufver-toast panel" role="status">
      <span className="tape hazard">UPDATE</span>
      <span className="ufver-text">{t('common.version.fresh', { v: fresh })}</span>
    </div>
  );
}
