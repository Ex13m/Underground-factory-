/**
 * SYSTEM BOOT — гибридное интро:
 * задний план — НАСТОЯЩЕЕ видео: тачка в темноте, камера медленно наезжает,
 * фары включаются (ролик затемнён и сливается с фоном);
 * передний план — графическая модалка загрузки как раньше: бегущие строки
 * лога и огоньки прогресса. В конце ролика — ТВ-помехи, глитч и сайт.
 * Показывается раз за сессию, скипается кликом, отключён в calm/reduced-motion.
 */

import { useEffect, useMemo, useState } from 'react';
import { useUI } from '../store/ui';
import '../styles/boot.css';

// ролик зажигания; когда Higgsfield доступен — заменить на спецролик
// «машина строго передом, камера наезжает, фары бьют в кадр»
// по пути /media/intro/ignition.mp4
const INTRO_VIDEO = '/media/cars/nissan-silvia-s15/live.mp4';
/** секунда ролика, на которой фары уже горят — резкая вспышка и переход */
const OUT_AT_SEC = 3.0;
const OUT_MS = 1100;

const LINES = [
  'UF SYSTEM v1.1 // INITIALIZING',
  'LOADING CHASSIS ............. OK',
  'MOUNTING AERO PARTS ......... OK',
  'CALIBRATING DOWNFORCE ....... OK',
  'IGNITION ▸ HEADLIGHTS',
];
const LINE_MS = 520;

type Phase = 'run' | 'out' | 'done';

export function BootIntro() {
  const calm = useUI((s) => s.calm);
  const skip = useMemo(() => {
    if (typeof window === 'undefined') return true;
    if (sessionStorage.getItem('uf:booted')) return true;
    if (navigator.webdriver) return true; // не мешаем автотестам
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
    return false;
  }, []);

  const [phase, setPhase] = useState<Phase>(skip || calm ? 'done' : 'run');
  const [lines, setLines] = useState(0);

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
    return () => {
      clearInterval(t);
      document.body.style.overflow = '';
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'out') return;
    const t = setTimeout(() => setPhase('done'), OUT_MS);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <div
      className={`boot boot--${phase}`}
      onClick={() => setPhase('out')}
      role="presentation"
    >
      {/* задний план: тачка в темноте, камера наезжает, свет включается */}
      <video
        className="boot-video"
        src={INTRO_VIDEO}
        autoPlay
        muted
        playsInline
        // ролик не сыграл — не держим пользователя
        onError={() => setPhase('done')}
        onEnded={() => setPhase('out')}
        onTimeUpdate={(e) => {
          if (phase === 'run' && e.currentTarget.currentTime >= OUT_AT_SEC) {
            setPhase('out');
          }
        }}
      />
      {/* резкая вспышка света в момент перехода */}
      <div className="boot-flash" aria-hidden />
      <div className="boot-vignette" aria-hidden />

      {/* логотип поверх видео */}
      <div className="boot-logo">
        <div className="uf-logo-mark" />
        <div className="boot-logo-text stencil">
          UNDERGROUND<br />FACTORY
          <small className="mono">CARBON DIV. // 軽量</small>
        </div>
      </div>

      {/* передний план: графическая модалка загрузки (лог + огоньки) */}
      <div className="boot-inner">
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

      {/* ТВ-помехи: проявляются в конце и уводят в сайт */}
      <div className="boot-noise" aria-hidden />
      <div className="hazard-stripe boot-stripe" />
    </div>
  );
}
