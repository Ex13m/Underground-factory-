/**
 * UNDERGROUND FACTORY — FX physics.
 * Дрифт-машинка-«преследователь»: ускорение к цели + инерционный нос
 * (heading догоняет вектор скорости через пружину с демпфером) => угол заноса.
 */

export const PHYS = {
  /** макс. скорость, px/s */
  MAX_SPEED: 950,
  /** разгон, px/s^2 */
  ACCEL: 900,
  /** торможение, px/s^2 */
  BRAKE: 1700,
  /** «сцепление»: скорость подтягивания вектора движения к носу, 1/s.
      Меньше — размашистее занос на резких поворотах */
  GRIP: 3.0,
  /** базовая скорость руления, rad/s */
  TURN_BASE: 2.2,
  /** прибавка к рулению за скорость, rad/s на px/s */
  TURN_PER_SPEED: 0.004,
  /** порог угла заноса для следа/дыма, rad */
  DRIFT_SLIP: 0.32,
  /** порог скорости для следа/дыма, px/s */
  DRIFT_SPEED: 260,
  /** ближе этого — сброс газа и торможение: подъехала и встала, px */
  STOP_DIST: 80,
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

/**
 * Один шаг физики (dt в секундах, вызывается из rAF).
 * Модель «как машина»: едет только туда, куда смотрит нос; к цели доворачивает
 * рулём с ограниченной скоростью (получается дуга), вектор движения догоняет
 * нос через «сцепление» — на резком довороте возникает красивый занос.
 * Цель сзади? Не разворачивается на месте, а закладывает дугу.
 * park=false — режим «показухи»: у цели не тормозим (дрифт вокруг флажка).
 */
export function updateCar(car: Car, tx: number, ty: number, dt: number, park = true): void {
  const dx = tx - car.x;
  const dy = ty - car.y;
  const dist = Math.hypot(dx, dy) || 1;

  // --- руль: нос доворачивает к цели с ограниченной угловой скоростью
  const diff = wrapAngle(Math.atan2(dy, dx) - car.heading);
  const steerRate = PHYS.TURN_BASE + car.speed * PHYS.TURN_PER_SPEED;
  car.heading = wrapAngle(car.heading + clamp(diff * 3.2, -steerRate, steerRate) * dt);
  car.steer = clamp(diff * 1.1, -0.6, 0.6);

  // --- газ/тормоз: цель по курсу и далеко → газ; сзади или рядом → сброс
  const align01 = Math.max(0, Math.cos(diff)); // 1 = точно по курсу
  const arriving = park && dist < PHYS.STOP_DIST;
  const targetSpeed = arriving
    ? 0
    : Math.min(PHYS.MAX_SPEED, (120 + dist * 2.6) * (0.25 + 0.75 * align01));
  const rate = targetSpeed > car.speed ? PHYS.ACCEL : PHYS.BRAKE;
  car.speed += clamp(targetSpeed - car.speed, -rate * dt, rate * dt);
  car.braking = targetSpeed < car.speed - 40;

  // --- сцепление: вектор движения тянется к направлению носа (иначе — занос)
  const k = Math.min(1, PHYS.GRIP * dt);
  car.vx += (Math.cos(car.heading) * car.speed - car.vx) * k;
  car.vy += (Math.sin(car.heading) * car.speed - car.vy) * k;
  car.slip = car.speed > 40 ? wrapAngle(Math.atan2(car.vy, car.vx) - car.heading) : car.slip * 0.9;

  car.x += car.vx * dt;
  car.y += car.vy * dt;
}
