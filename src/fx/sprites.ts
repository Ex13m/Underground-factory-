/**
 * UNDERGROUND FACTORY — canvas-спрайты FX-слоя.
 * Всё рисуется кодом: машинка (вид сверху), финишный флажок, кольцо-мишень.
 */
import type { Car } from './physics';

const BLOOD = '#e01b22';
const BLOOD_DIM = '#8f1216';
const PAPER = '#eceae5';
const PAPER_DIM = '#d6d3cc';
const DARK = '#141311';

/** Масштаб спрайта машинки (локальные координаты ~46x22). */
export const SPRITE_SCALE = 1.25;

/** Локальные координаты центров задних колёс (до масштаба). */
export const REAR_AXLE_X = -14;
export const REAR_TRACK_Y = 9;

/** Стилизованное купе, вид сверху. Поворот = car.heading, руление = car.steer. */
export function drawCarSprite(ctx: CanvasRenderingContext2D, car: Car): void {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.heading);
  ctx.scale(SPRITE_SCALE, SPRITE_SCALE);

  // тень
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, 2.5, 25, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // широкие арки (шире корпуса)
  ctx.fillStyle = PAPER_DIM;
  ctx.fillRect(-20, -11, 12, 22);
  ctx.fillRect(7, -11, 12, 22);

  // колёса (передние повёрнуты на угол руления)
  ctx.fillStyle = '#0c0c0b';
  const wheel = (x: number, y: number, angle: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillRect(-4.5, -2.5, 9, 5);
    ctx.restore();
  };
  wheel(REAR_AXLE_X, -REAR_TRACK_Y, 0);
  wheel(REAR_AXLE_X, REAR_TRACK_Y, 0);
  wheel(13, -REAR_TRACK_Y, car.steer);
  wheel(13, REAR_TRACK_Y, car.steer);

  // корпус — низкое купе (нос вправо, +x)
  ctx.fillStyle = PAPER;
  ctx.beginPath();
  ctx.moveTo(23, -3.5);
  ctx.quadraticCurveTo(23.8, 0, 23, 3.5);
  ctx.lineTo(16, 8.5);
  ctx.lineTo(-13, 9);
  ctx.quadraticCurveTo(-22, 9, -22, 4);
  ctx.lineTo(-22, -4);
  ctx.quadraticCurveTo(-22, -9, -13, -9);
  ctx.lineTo(16, -8.5);
  ctx.closePath();
  ctx.fill();

  // лобовое и заднее стекло, крыша
  ctx.fillStyle = DARK;
  ctx.fillRect(4, -6, 4.5, 12);
  ctx.fillRect(-11, -5.5, 3, 11);
  ctx.fillStyle = PAPER_DIM;
  ctx.fillRect(-8, -6, 12, 12);

  // красная полоса по центру (через капот, крышу и багажник)
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = BLOOD;
  ctx.fillRect(-22, -2.5, 45, 5);
  ctx.globalAlpha = 1;

  // красный сплиттер на носу
  ctx.fillStyle = BLOOD;
  ctx.fillRect(21.5, -8.5, 2.5, 17);

  // фирменная фишка: скотч-крест на капоте
  ctx.strokeStyle = 'rgba(244, 240, 226, 0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(11, -4);
  ctx.lineTo(17, 2);
  ctx.moveTo(17, -4);
  ctx.lineTo(11, 2);
  ctx.stroke();

  // 'UF' на крыше (поперёк, поверх полосы)
  ctx.save();
  ctx.translate(-2, 0);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = PAPER;
  ctx.font = 'bold 7px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('UF', 0, 0);
  ctx.restore();

  // стоп-огни при торможении
  if (car.braking) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#ff2b31';
    ctx.fillRect(-26, -8.5, 6, 6);
    ctx.fillRect(-26, 2.5, 6, 6);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ff3b40';
    ctx.fillRect(-23, -7.5, 2.5, 4);
    ctx.fillRect(-23, 3.5, 2.5, 4);
  }

  ctx.restore();
}

const FLAG_COLS = 4;
const FLAG_ROWS = 3;
const CELL_W = 6.5;
const CELL_H = 5.5;
const POLE_H = 30;

/**
 * Финишный флажок: древко в точке курсора, клетчатое полотнище 4x3
 * волнуется по синусу; в состоянии aim машет сильнее и быстрее.
 */
export function drawFlag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  aim: boolean,
): void {
  const topX = x;
  const topY = y - POLE_H;

  // древко
  ctx.strokeStyle = '#9a968c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + 1);
  ctx.lineTo(topX, topY - 1);
  ctx.stroke();

  // навершие
  ctx.fillStyle = BLOOD;
  ctx.beginPath();
  ctx.arc(topX, topY - 2, 2, 0, Math.PI * 2);
  ctx.fill();

  // волна: смещение вертикальных кромок полотнища (у древка — 0)
  const amp = aim ? 3.4 : 1.7;
  const spd = aim ? 15 : 8;
  const off: number[] = [];
  for (let i = 0; i <= FLAG_COLS; i++) {
    off.push(Math.sin(t * spd + i * 0.85) * amp * (i / FLAG_COLS));
  }

  // клетки 4x3 (чёрный/белый)
  for (let c = 0; c < FLAG_COLS; c++) {
    const x0 = topX + 1 + c * CELL_W;
    const x1 = x0 + CELL_W;
    for (let r = 0; r < FLAG_ROWS; r++) {
      const yl = topY + r * CELL_H + off[c];
      const yr = topY + r * CELL_H + off[c + 1];
      ctx.fillStyle = (c + r) % 2 === 0 ? '#0d0d0c' : '#f4f2ec';
      ctx.beginPath();
      ctx.moveTo(x0, yl);
      ctx.lineTo(x1, yr);
      ctx.lineTo(x1, yr + CELL_H);
      ctx.lineTo(x0, yl + CELL_H);
      ctx.closePath();
      ctx.fill();
    }
  }

  // контур полотнища (чтобы чёрные клетки читались на тёмном фоне)
  ctx.strokeStyle = 'rgba(236, 234, 229, 0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(topX + 1, topY + off[0]);
  for (let i = 1; i <= FLAG_COLS; i++) ctx.lineTo(topX + 1 + i * CELL_W, topY + off[i]);
  for (let i = FLAG_COLS; i >= 0; i--) {
    ctx.lineTo(topX + 1 + i * CELL_W, topY + FLAG_ROWS * CELL_H + off[i]);
  }
  ctx.closePath();
  ctx.stroke();
}

/**
 * Кружок-маркер (красное кольцо-мишень с пульсацией) — точка преследования.
 * В состоянии aim кольцо сжимается и пульсирует чаще.
 */
export function drawTargetRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  aim: boolean,
): void {
  const base = aim ? 6.5 : 12;
  const pulse = Math.sin(t * (aim ? 10 : 5.5)) * (aim ? 1 : 2.6);
  const r = Math.max(2, base + pulse);

  ctx.strokeStyle = BLOOD;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();

  // внешнее слабое кольцо
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = BLOOD_DIM;
  ctx.beginPath();
  ctx.arc(x, y, r + 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // центральная точка
  ctx.fillStyle = BLOOD;
  ctx.beginPath();
  ctx.arc(x, y, aim ? 2.5 : 1.8, 0, Math.PI * 2);
  ctx.fill();
}
