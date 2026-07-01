/**
 * UNDERGROUND FACTORY — FX physics.
 * Дрифт-машинка-«преследователь»: ускорение к цели + инерционный нос
 * (heading догоняет вектор скорости через пружину с демпфером) => угол заноса.
 */

export const PHYS = {
  /** макс. скорость, px/s */
  MAX_SPEED: 950,
  /** тяга к цели, px/s^2 */
  ACCEL: 2400,
  /** экспоненциальное сопротивление, 1/s */
  DRAG: 1.4,
  /** пружина носа: rad/s^2 на радиан рассогласования */
  TURN_SPRING: 38,
  /** демпфер угловой скорости, 1/s (ζ≈0.6 — лёгкий overshoot) */
  TURN_DAMP: 7.5,
  /** порог угла заноса для следа/дыма, rad */
  DRIFT_SLIP: 0.32,
  /** порог скорости для следа/дыма, px/s */
  DRIFT_SPEED: 260,
  /** ближе этого — переходим на орбиту-«восьмёрку» вокруг кружка, px */
  ORBIT_DIST: 150,
  /** радиус орбиты, px */
  ORBIT_R: 95,
  /** угловая скорость орбитальной цели, rad/s */
  ORBIT_SPEED: 2.6,
  /** лимит кольцевого буфера следа шин (сегменты) */
  TRAIL_MAX: 400,
  /** лимит частиц дыма */
  SMOKE_MAX: 80,
} as const;

export interface Car {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** куда смотрит нос, rad */
  heading: number;
  /** угловая скорость носа, rad/s */
  angVel: number;
  /** визуальный угол руления передних колёс (контр-руление в занос) */
  steer: number;
  /** угол заноса = angle(velocity) - heading */
  slip: number;
  speed: number;
  braking: boolean;
}

export interface TrailSeg {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  life: number;
  red: boolean;
}

export interface SmokeP {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
}

/** Кольцевой буфер фиксированной ёмкости: старые элементы перезаписываются. */
export class Ring<T> {
  private buf: T[] = [];
  private head = 0;
  constructor(private cap: number) {}
  push(item: T): void {
    if (this.buf.length < this.cap) {
      this.buf.push(item);
    } else {
      this.buf[this.head] = item;
      this.head = (this.head + 1) % this.cap;
    }
  }
  forEach(fn: (item: T) => void): void {
    for (let i = 0; i < this.buf.length; i++) fn(this.buf[i]);
  }
}

export function wrapAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function createCar(x: number, y: number, vx: number, vy: number, heading: number): Car {
  return {
    x,
    y,
    vx,
    vy,
    heading,
    angVel: 0,
    steer: 0,
    slip: 0,
    speed: Math.hypot(vx, vy),
    braking: false,
  };
}

/** Один шаг физики (dt в секундах, вызывается из rAF). */
export function updateCar(car: Car, tx: number, ty: number, dt: number): void {
  const dx = tx - car.x;
  const dy = ty - car.y;
  const dist = Math.hypot(dx, dy) || 1;

  // тяга к цели
  car.vx += (dx / dist) * PHYS.ACCEL * dt;
  car.vy += (dy / dist) * PHYS.ACCEL * dt;

  // сопротивление
  const drag = Math.exp(-PHYS.DRAG * dt);
  car.vx *= drag;
  car.vy *= drag;

  // ограничение скорости: у цели медленнее (не таранит кружок)
  let speed = Math.hypot(car.vx, car.vy);
  const cap = Math.min(PHYS.MAX_SPEED, 140 + dist * 3.2);
  if (speed > cap) {
    const k = cap / speed;
    car.vx *= k;
    car.vy *= k;
    speed = cap;
  }

  // нос догоняет вектор скорости с запаздыванием (пружина+демпфер) => занос
  if (speed > 24) {
    const va = Math.atan2(car.vy, car.vx);
    const diff = wrapAngle(va - car.heading);
    car.angVel += (diff * PHYS.TURN_SPRING - car.angVel * PHYS.TURN_DAMP) * dt;
    car.slip = diff;
    car.steer = clamp(diff * 1.25, -0.6, 0.6); // контр-руление
  } else {
    car.angVel *= Math.exp(-6 * dt);
    car.slip *= 0.9;
    car.steer *= 0.85;
  }
  car.heading = wrapAngle(car.heading + car.angVel * dt);

  // торможение (с гистерезисом, чтобы стопы не мигали)
  const decel = (speed - car.speed) / Math.max(dt, 1e-4);
  car.braking = decel < -300 || (car.braking && decel < -60);
  car.speed = speed;

  car.x += car.vx * dt;
  car.y += car.vy * dt;
}
