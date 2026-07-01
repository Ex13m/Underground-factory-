/**
 * SYSTEM BOOT — входной экран из stitch technical_spec v1.0 («Входная группа»):
 * HUD-инициализация с прогресс-барами и сборкой машины из частей.
 * Лёгкая реализация без Three.js: SVG-слои + CSS-анимации.
 * Показывается раз за сессию, скипается кликом, отключён в calm/reduced-motion.
 */

import { useEffect, useMemo, useState } from 'react';
import { useUI } from '../store/ui';
import '../styles/boot.css';

const LINES = [
  'UF SYSTEM v1.1 // INITIALIZING',
  'LOADING CHASSIS ............. OK',
  'MOUNTING AERO PARTS ......... OK',
  'CALIBRATING DOWNFORCE ....... OK',
  'QC ▸ PASSED // WELCOME, PILOT',
];

const LINE_MS = 430;
const HOLD_MS = 700;

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
  const [phase, setPhase] = useState<'run' | 'fade' | 'done'>(skip || calm ? 'done' : 'run');

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
    const end = setTimeout(() => setPhase('fade'), LINE_MS * LINES.length + HOLD_MS);
    return () => {
      clearInterval(t);
      clearTimeout(end);
      document.body.style.overflow = '';
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'fade') return;
    const t = setTimeout(() => setPhase('done'), 500);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <div className={`boot ${phase === 'fade' ? 'boot-out' : ''}`} onClick={() => setPhase('fade')} role="presentation">
      <div className="boot-inner">
        <svg className="boot-car" viewBox="0 0 400 200" aria-hidden>
          {/* корпус въезжает слева */}
          <path
            className="boot-part boot-body"
            d="M20,155 L45,150 Q60,120 95,112 L130,92 Q170,78 225,82 L275,95 Q330,100 355,118 L378,140 Q385,148 382,155 L360,158 L100,158 L25,158 Z"
            fill="#eceae5"
          />
          {/* антикрыло падает сверху */}
          <g className="boot-part boot-wing">
            <rect x="330" y="88" width="52" height="7" fill="#e01b22" />
            <rect x="352" y="95" width="8" height="20" fill="#eceae5" />
          </g>
          {/* колёса вкатываются снизу */}
          <g className="boot-part boot-wheels">
            <circle cx="120" cy="158" r="20" fill="#0a0a09" stroke="#eceae5" strokeWidth="3" />
            <circle cx="120" cy="158" r="7" fill="#e01b22" />
            <circle cx="320" cy="158" r="20" fill="#0a0a09" stroke="#eceae5" strokeWidth="3" />
            <circle cx="320" cy="158" r="7" fill="#e01b22" />
          </g>
          <text x="14" y="24" className="boot-svg-label">UF—042 // PROTOTYPE</text>
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

        <button className="boot-skip mono" onClick={() => setPhase('fade')}>SKIP ▸</button>
      </div>
      <div className="hazard-stripe boot-stripe" />
    </div>
  );
}
