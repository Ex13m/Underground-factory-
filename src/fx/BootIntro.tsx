/**
 * SYSTEM BOOT — входной экран на НАСТОЯЩЕМ видео: тачка в темноте включает
 * фары в зрителя (сгенерированный ролик). К концу ролика экран накрывают
 * телевизионные помехи, и сквозь глитч плавно проступает сайт.
 * Логотип поверх видео. Показывается раз за сессию, скипается кликом,
 * отключён в calm/reduced-motion и для автотестов.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useUI } from '../store/ui';
import '../styles/boot.css';

// ролик зажигания; когда Higgsfield доступен — заменить на спецролик
// «фары строго в камеру» по пути /media/intro/ignition.mp4
const INTRO_VIDEO = '/media/cars/nissan-silvia-s15/live.mp4';
/** за сколько секунд до конца ролика начинаем помехи */
const OUT_BEFORE_END = 0.5;
const OUT_MS = 1100;

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
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (phase === 'done') return;
    sessionStorage.setItem('uf:booted', '1');
    document.body.style.overflow = 'hidden';
    return () => {
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
      <video
        ref={videoRef}
        className="boot-video"
        src={INTRO_VIDEO}
        autoPlay
        muted
        playsInline
        // ролик не найден/не сыграл — интро не должно держать пользователя
        onError={() => setPhase('done')}
        onEnded={() => setPhase('out')}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          if (phase === 'run' && v.duration && v.duration - v.currentTime <= OUT_BEFORE_END) {
            setPhase('out');
          }
        }}
      />
      {/* лёгкое затемнение краёв, чтобы логотип читался */}
      <div className="boot-vignette" aria-hidden />

      {/* логотип поверх видео */}
      <div className="boot-logo">
        <div className="uf-logo-mark" />
        <div className="boot-logo-text stencil">
          UNDERGROUND<br />FACTORY
          <small className="mono">CARBON DIV. // 軽量</small>
        </div>
      </div>

      <button className="boot-skip mono" onClick={(e) => { e.stopPropagation(); setPhase('out'); }}>
        SKIP ▸
      </button>

      {/* телевизионные помехи: проявляются в конце и уводят в сайт */}
      <div className="boot-noise" aria-hidden />
      <div className="hazard-stripe boot-stripe" />
    </div>
  );
}
