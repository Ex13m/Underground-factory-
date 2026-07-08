/**
 * SYSTEM BOOT — входной экран: тачка стоит в темноте (кузов в цвет экрана,
 * едва читается контуром), над ней тусклый логотип и лог загрузки.
 * Когда загрузка доходит до конца — тачка ВКЛЮЧАЕТ ФАРЫ прямо в зрителя:
 * экран заливает свет, логотип вспыхивает, и всё рассыпается глитчем,
 * открывая сайт. Показывается раз за сессию, скипается кликом,
 * отключён в calm/reduced-motion и для автотестов.
 */

import { useEffect, useMemo, useState } from 'react';
import { useUI } from '../store/ui';
import '../styles/boot.css';

const LINES = [
  'UF SYSTEM v1.1 // INITIALIZING',
  'LOADING CHASSIS ............. OK',
  'MOUNTING AERO PARTS ......... OK',
  'CALIBRATING DOWNFORCE ....... OK',
  'IGNITION ▸ HEADLIGHTS',
];

const LINE_MS = 400;
const FLASH_MS = 750;
const OUT_MS = 620;

type Phase = 'run' | 'flash' | 'out' | 'done';

export function BootIntro() {
  const calm = useUI((s) => s.calm);
  const skip = useMemo(() => {
    if (typeof window === 'undefined') return true;
    if (sessionStorage.getItem('uf:booted')) return true;
    if (navigator.webdriver) return true; // не мешаем автотестам
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
    return false;
  }, []);

  const [lines, setLines] = useState(0);
  const [phase, setPhase] = useState<Phase>(skip || calm ? 'done' : 'run');

  // фаза загрузки: строки лога, затем — вспышка фар
  useEffect(() => {
    if (phase !== 'run') return;
    sessionStorage.setItem('uf:booted', '1');
    document.body.style.overflow = 'hidden';
    const t = setInterval(() => {
      setLines((n) => {
        if (n + 1 >= LINES.length) clearInterval(t);
        return Math.min(n + 1, LINES.length);
      });
    }, LINE_MS);
    const end = setTimeout(() => setPhase('flash'), LINE_MS * LINES.length + 350);
    return () => {
      clearInterval(t);
      clearTimeout(end);
      document.body.style.overflow = '';
    };
  }, [phase]);

  // вспышка фар → глитч-распад → сайт
  useEffect(() => {
    if (phase === 'flash') {
      const t = setTimeout(() => setPhase('out'), FLASH_MS);
      return () => clearTimeout(t);
    }
    if (phase === 'out') {
      const t = setTimeout(() => setPhase('done'), OUT_MS);
      return () => clearTimeout(t);
    }
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <div
      className={`boot boot--${phase}`}
      onClick={() => setPhase(phase === 'run' ? 'flash' : 'out')}
      role="presentation"
    >
      {/* логотип: тусклый в темноте, вспыхивает вместе с фарами */}
      <div className="boot-logo">
        <div className="uf-logo-mark" />
        <div className="boot-logo-text stencil">
          UNDERGROUND<br />FACTORY
          <small className="mono">CARBON DIV. // 軽量</small>
        </div>
      </div>

      <div className="boot-inner">
        {/* тачка-фронт в темноте: кузов в цвет экрана, читается только контуром */}
        <svg className="boot-car" viewBox="0 0 400 190" aria-hidden>
          {/* силуэт: широкая низкая морда */}
          <path
            className="boot-shape"
            d="M52,150 L56,108 Q60,86 92,80 L128,60 Q160,50 200,50 Q240,50 272,60 L308,80 Q340,86 344,108 L348,150 Q348,158 338,158 L62,158 Q52,158 52,150 Z"
          />
          {/* крыша/стёкла едва темнее */}
          <path className="boot-glass" d="M136,64 Q168,55 200,55 Q232,55 264,64 L252,84 Q200,78 148,84 Z" />
          {/* воздухозаборник и сплиттер */}
          <rect className="boot-vent" x="150" y="120" width="100" height="18" rx="2" />
          <rect className="boot-splitter" x="70" y="146" width="260" height="6" />
          {/* колёса по краям */}
          <rect className="boot-tyre" x="38" y="120" width="26" height="38" rx="6" />
          <rect className="boot-tyre" x="336" y="120" width="26" height="38" rx="6" />
          {/* ФАРЫ: гаснут в темноте, вспыхивают в фазе flash */}
          <g className="boot-heads">
            <path className="boot-head" d="M86,96 L134,90 L136,106 L90,110 Z" />
            <path className="boot-head" d="M314,96 L266,90 L264,106 L310,110 Z" />
          </g>
        </svg>

        <div className="boot-log mono">
          {LINES.slice(0, lines).map((l, i) => (
            <div key={i} className="boot-line">{l}</div>
          ))}
        </div>

        <div className="boot-bars">
          <div className="boot-bar"><span /></div>
          <div className="boot-bar"><span /></div>
          <div className="boot-bar"><span /></div>
        </div>

        <button className="boot-skip mono" onClick={(e) => { e.stopPropagation(); setPhase('out'); }}>
          SKIP ▸
        </button>
      </div>

      {/* свет фар в зрителя: заливает экран в фазе flash */}
      <div className="boot-beam" aria-hidden />
      <div className="hazard-stripe boot-stripe" />
    </div>
  );
}
