/**
 * ВИДЕОСАЛОН — «записи с камер» на весь экран: все ролики завода идут
 * бесконечным перетасованным эфиром (VideoBg), поверх — CCTV-навигация:
 * мигающий REC, живой таймкод, номер камеры, сканлайны. Музыка радио
 * продолжает играть. Выход — Esc или ✕.
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { VideoBg } from '../lib/media';
import { TV_CLIPS } from '../data/tv';
import { useOnAir, filterOnAir } from '../store/onair';
import '../styles/tv.css';

const CAMS = ['DOCKS', 'GARAGE', 'GATE 4', 'CANAL', 'ROOFTOP', 'YARD', 'TOUGE', 'APRON'];

export function TvSalon() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [clock, setClock] = useState('');
  const [cam, setCam] = useState(0);
  // эфир: выключенные в админке ролики не показываем; пусто не бывает — fallback на полный список
  const offAir = useOnAir((s) => s.off);
  const trims = useOnAir((s) => s.trims);
  const clips = useMemo(() => filterOnAir(TV_CLIPS, offAir), [offAir]);

  // живой таймкод + смена «камеры» каждые ~6 секунд
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const p = (n: number, l = 2) => String(n).padStart(l, '0');
      setClock(`${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(Math.floor(d.getMilliseconds() / 40), 2)}`);
    };
    tick();
    const t1 = window.setInterval(tick, 120);
    const t2 = window.setInterval(() => setCam((c) => (c + 1) % CAMS.length), 6000);
    return () => {
      window.clearInterval(t1);
      window.clearInterval(t2);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && navigate('/');
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  return (
    <div className="tv" data-testid="tv-salon">
      <VideoBg sources={clips} seed="tv-salon" className="tv-video" trims={trims} />
      <div className="tv-scanlines" aria-hidden />
      <div className="tv-vignette" aria-hidden />

      {/* CCTV HUD */}
      <div className="tv-hud mono" aria-hidden>
        <div className="tv-hud-tl">
          <span className="tv-rec"><i /> REC</span>
          <span>UF CCTV ▸ CAM 0{cam + 1} // {CAMS[cam]}</span>
        </div>
        <div className="tv-hud-tr">{clock}</div>
        <div className="tv-hud-bl">{t('tv.note')}</div>
        <div className="tv-hud-br">UF—042 // {t('tv.title')}</div>
      </div>

      <button className="tv-exit mono" onClick={() => navigate('/')} aria-label="exit">
        ✕ ESC
      </button>
    </div>
  );
}
