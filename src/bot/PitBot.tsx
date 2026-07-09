/**
 * ПИТ-БОТ — живой маскот рации: робот из карбона.
 * Реагирует на курсор: чем быстрее водишь мышкой по странице, тем яростнее
 * машет руками-лопатами и трясёт антенной; глаз-визор следит за курсором.
 * Вся анимация — прямые transform'ы через rAF (без ре-рендеров React).
 * Отключается в calm-режиме, на тач-устройствах и при prefers-reduced-motion —
 * тогда стоит смирно, лишь глаз следит (если может).
 */
import { useEffect, useRef } from 'react';
import { useUI } from '../store/ui';

const REDUCED =
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
    window.matchMedia?.('(pointer: coarse)').matches);

export function PitBotAvatar() {
  const calm = useUI((s) => s.calm);
  const rootRef = useRef<SVGSVGElement>(null);
  const armLRef = useRef<SVGGElement>(null);
  const armRRef = useRef<SVGGElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const eyeRef = useRef<SVGCircleElement>(null);
  const antennaRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const animate = !calm && !REDUCED;
    let raf = 0;
    let t = 0;
    let last = performance.now();
    let energy = 0; // «завод» от скорости мыши, 0..1
    let lastMx = -1;
    let lastMy = -1;
    let mx = 0;
    let my = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (lastMx >= 0) {
        const d = Math.hypot(e.clientX - lastMx, e.clientY - lastMy);
        energy = Math.min(1, energy + d / 900);
      }
      lastMx = e.clientX;
      lastMy = e.clientY;
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      energy = Math.max(0, energy - dt * 0.9); // затухание за ~1с

      // глаз следит за курсором всегда (это дёшево и мило)
      const el = rootRef.current;
      if (el && eyeRef.current && lastMx >= 0) {
        const r = el.getBoundingClientRect();
        const dx = mx - (r.left + r.width / 2);
        const dy = my - (r.top + r.height * 0.32);
        const a = Math.atan2(dy, dx);
        const len = Math.min(2.2, Math.hypot(dx, dy) / 40);
        eyeRef.current.setAttribute(
          'transform',
          `translate(${(Math.cos(a) * len).toFixed(2)} ${(Math.sin(a) * len).toFixed(2)})`,
        );
      }

      if (animate) {
        // руки: лёгкое дыхание в покое + бешеный взмах от разгона мыши
        const idle = Math.sin(t * 2.2) * 5;
        const flail = energy * energy; // резвость растёт нелинейно
        const wave = Math.sin(t * 16) * 55 * flail;
        const waveR = Math.sin(t * 16 + 1.4) * 55 * flail;
        armLRef.current?.setAttribute('transform', `rotate(${(-14 - idle - wave).toFixed(1)} 17 34)`);
        armRRef.current?.setAttribute('transform', `rotate(${(14 + idle + waveR).toFixed(1)} 47 34)`);
        // голова покачивается, антенна пружинит
        headRef.current?.setAttribute(
          'transform',
          `rotate(${(Math.sin(t * 9 + 0.5) * 7 * flail + Math.sin(t * 1.7) * 1.5).toFixed(1)} 32 26)`,
        );
        antennaRef.current?.setAttribute(
          'transform',
          `rotate(${(Math.sin(t * 12) * (4 + 26 * flail)).toFixed(1)} 32 12)`,
        );
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
    };
  }, [calm]);

  return (
    <svg ref={rootRef} width="44" height="44" viewBox="0 0 64 64" aria-hidden focusable="false" className="uf-pitbot">
      <defs>
        {/* карбоновое плетение: диагональная клетка */}
        <pattern id="ufCarbon" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="#15151a" />
          <rect width="3" height="3" fill="#1f1f26" />
          <rect x="3" y="3" width="3" height="3" fill="#1f1f26" />
        </pattern>
      </defs>

      {/* антенна */}
      <g ref={antennaRef}>
        <line x1="32" y1="14" x2="32" y2="6" stroke="#3a3a42" strokeWidth="2" />
        <circle cx="32" cy="5" r="2.6" fill="#e01b22">
          <animate attributeName="opacity" values="1;.35;1" dur="1.6s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* голова: карбон + красный визор со следящим глазом */}
      <g ref={headRef}>
        <rect x="21" y="13" width="22" height="17" rx="4" fill="url(#ufCarbon)" stroke="#0a0a09" strokeWidth="1.6" />
        <rect x="24" y="18" width="16" height="7" rx="2.4" fill="#0a0a09" />
        <circle ref={eyeRef} cx="32" cy="21.5" r="2.6" fill="#e01b22" />
        <path d="M25 15.5 h6" stroke="#e01b22" strokeWidth="1.4" opacity="0.8" />
      </g>

      {/* левая рука-лопата (шарнир в плече 17,34) */}
      <g ref={armLRef}>
        <line x1="17" y1="34" x2="9" y2="44" stroke="#2a2a31" strokeWidth="4" strokeLinecap="round" />
        <circle cx="8" cy="45.5" r="4.4" fill="url(#ufCarbon)" stroke="#e01b22" strokeWidth="1.4" />
      </g>
      {/* правая рука-лопата (шарнир 47,34) */}
      <g ref={armRRef}>
        <line x1="47" y1="34" x2="55" y2="44" stroke="#2a2a31" strokeWidth="4" strokeLinecap="round" />
        <circle cx="56" cy="45.5" r="4.4" fill="url(#ufCarbon)" stroke="#e01b22" strokeWidth="1.4" />
      </g>

      {/* корпус: карбоновый бочонок с красной сигнальной полосой и заклёпками */}
      <rect x="19" y="31" width="26" height="22" rx="5" fill="url(#ufCarbon)" stroke="#0a0a09" strokeWidth="1.6" />
      <rect x="30.6" y="31" width="2.8" height="22" fill="#e01b22" opacity="0.9" />
      <circle cx="23" cy="35" r="1" fill="#4a4a52" />
      <circle cx="41" cy="35" r="1" fill="#4a4a52" />
      <circle cx="23" cy="49" r="1" fill="#4a4a52" />
      <circle cx="41" cy="49" r="1" fill="#4a4a52" />
      {/* трафарет на груди */}
      <path d="M36 41 h5 M36 44 h5" stroke="#6a6a72" strokeWidth="1" opacity="0.8" />

      {/* ноги-культяпки */}
      <line x1="26" y1="53" x2="26" y2="58" stroke="#2a2a31" strokeWidth="4" strokeLinecap="round" />
      <line x1="38" y1="53" x2="38" y2="58" stroke="#2a2a31" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
