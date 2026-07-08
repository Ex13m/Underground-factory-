/**
 * UNDERGROUND FACTORY — CursorFX.
 * Курсор: открытое перекрестие в точке клика + маленький флажок 🏁 вбок
 * (верхний canvas, z 9600) и дрифт-машинка-преследователь (нижний canvas,
 * z 8900, под .noise=9000).
 *
 * Полностью выключается при: useUI.calm, (pointer: coarse), prefers-reduced-motion.
 * Один rAF-цикл, пауза при скрытой вкладке, cleanup при unmount.
 */
import { useEffect, useRef, useState } from 'react';
import { useUI } from '../store/ui';
import {
  PHYS,
  Ring,
  createCar,
  updateCar,
  type SmokeP,
  type TrailSeg,
} from './physics';
import {
  REAR_AXLE_X,
  REAR_TRACK_Y,
  SPRITE_SCALE,
  drawCarSprite,
  drawFlag,
} from './sprites';
import '../styles/fx.css';

const INTERACTIVE = 'a, button, input, select, textarea, [role="button"], .btn';

export function CursorFX() {
  const calm = useUI((s) => s.calm);
  const [hwOk, setHwOk] = useState(false);
  const carCanvasRef = useRef<HTMLCanvasElement>(null);
  const flagCanvasRef = useRef<HTMLCanvasElement>(null);

  // тач-устройства и reduced-motion — FX выключен, следим за изменениями
  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setHwOk(!coarse.matches && !reduced.matches);
    sync();
    coarse.addEventListener('change', sync);
    reduced.addEventListener('change', sync);
    return () => {
      coarse.removeEventListener('change', sync);
      reduced.removeEventListener('change', sync);
    };
  }, []);

  const enabled = !calm && hwOk;

  useEffect(() => {
    if (!enabled) return;
    const carCanvas = carCanvasRef.current;
    const flagCanvas = flagCanvasRef.current;
    if (!carCanvas || !flagCanvas) return;
    const cc = carCanvas.getContext('2d');
    const fc = flagCanvas.getContext('2d');
    if (!cc || !fc) return;

    document.documentElement.classList.add('fx-no-cursor');

    // --- размеры / DPR
    let W = window.innerWidth;
    let H = window.innerHeight;
    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      for (const [cv, ctx] of [
        [carCanvas, cc],
        [flagCanvas, fc],
      ] as const) {
        cv.width = Math.round(W * dpr);
        cv.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // --- мышь
    const mouse = { x: W / 2, y: H / 2, seen: false, aim: false };
    let hitPending = false;
    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.seen = true;
      hitPending = true; // hit-test один раз за кадр, не на каждый event
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    // --- машинка: въезжает из-за левого края с заносом
    const car = createCar(-140, H * 0.72, 880, -140, Math.atan2(-140, 880) + 1.0);
    const trails = new Ring<TrailSeg>(PHYS.TRAIL_MAX);
    const smoke = new Ring<SmokeP>(PHYS.SMOKE_MAX);
    let segFlip = 0;
    let smokeAcc = 0;

    /** мировые координаты задних колёс (для следа и дыма) */
    const rearWheels = (): [{ x: number; y: number }, { x: number; y: number }] => {
      const cos = Math.cos(car.heading);
      const sin = Math.sin(car.heading);
      const lx = REAR_AXLE_X * SPRITE_SCALE;
      const ly = REAR_TRACK_Y * SPRITE_SCALE;
      return [
        { x: car.x + cos * lx + sin * ly, y: car.y + sin * lx - cos * ly },
        { x: car.x + cos * lx - sin * ly, y: car.y + sin * lx + cos * ly },
      ];
    };

    // --- rAF-цикл
    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now / 1000;

      // hit-test интерактивных элементов (состояние 'aim')
      if (hitPending) {
        hitPending = false;
        const el = document.elementFromPoint(mouse.x, mouse.y);
        mouse.aim = !!(el && el.closest(INTERACTIVE));
      }

      // цель машинки = сам курсор; до первого движения мыши — центр экрана
      const cx = mouse.seen ? mouse.x : W / 2;
      const cy = mouse.seen ? mouse.y : H / 2;

      const [rl0, rr0] = rearWheels();
      updateCar(car, cx, cy, dt);
      const [rl1, rr1] = rearWheels();

      // дрифт: след шин + дым
      const drifting = Math.abs(car.slip) > PHYS.DRIFT_SLIP && car.speed > PHYS.DRIFT_SPEED;
      if (drifting) {
        for (const [a, b] of [
          [rl0, rl1],
          [rr0, rr1],
        ] as const) {
          if (Math.hypot(b.x - a.x, b.y - a.y) < 60) {
            trails.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, life: 1, red: (segFlip++ & 3) === 0 });
          }
        }
        smokeAcc += dt * 26;
        while (smokeAcc >= 1) {
          smokeAcc -= 1;
          const w = Math.random() < 0.5 ? rl1 : rr1;
          smoke.push({
            x: w.x + (Math.random() - 0.5) * 6,
            y: w.y + (Math.random() - 0.5) * 6,
            vx: -Math.cos(car.heading) * 30 + (Math.random() - 0.5) * 40,
            vy: -Math.sin(car.heading) * 30 + (Math.random() - 0.5) * 40,
            r: 3 + Math.random() * 4,
            life: 1,
          });
        }
      } else {
        smokeAcc = 0;
      }

      // ---- нижний слой: след, дым, машинка
      cc.clearRect(0, 0, W, H);
      cc.lineCap = 'round';
      cc.lineWidth = 3;
      trails.forEach((s) => {
        s.life -= dt * 0.5;
        if (s.life <= 0) return;
        cc.globalAlpha = s.life * 0.55;
        cc.strokeStyle = s.red ? '#8f1216' : '#000';
        cc.beginPath();
        cc.moveTo(s.x1, s.y1);
        cc.lineTo(s.x2, s.y2);
        cc.stroke();
      });
      cc.globalAlpha = 1;
      smoke.forEach((p) => {
        p.life -= dt * 0.9;
        if (p.life <= 0) return;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.r += 26 * dt;
        cc.globalAlpha = p.life * 0.28;
        cc.fillStyle = '#a8a49c';
        cc.beginPath();
        cc.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        cc.fill();
      });
      cc.globalAlpha = 1;
      drawCarSprite(cc, car);

      // ---- верхний слой: перекрестие + флажок вместо курсора
      fc.clearRect(0, 0, W, H);
      if (mouse.seen) {
        drawFlag(fc, mouse.x, mouse.y, t, mouse.aim);
      }
    };
    raf = requestAnimationFrame(frame);

    // пауза при скрытой вкладке
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('visibilitychange', onVis);
      document.documentElement.classList.remove('fx-no-cursor');
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <>
      <canvas ref={carCanvasRef} className="fx-canvas fx-canvas--car" aria-hidden />
      <canvas ref={flagCanvasRef} className="fx-canvas fx-canvas--flag" aria-hidden />
    </>
  );
}
