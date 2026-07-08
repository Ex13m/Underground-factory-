/**
 * Анимированная фавиконка: крутящееся колесо (шина + красная ступица + спицы).
 * GIF в фавиконке Chrome не анимирует, поэтому кадры рисуются на canvas
 * и подменяются в <link rel="icon"> (~10 кадров/с). Пауза на скрытой вкладке.
 */

const SIZE = 64;

function drawWheel(ctx: CanvasRenderingContext2D, angle: number) {
  const c = SIZE / 2;
  ctx.clearRect(0, 0, SIZE, SIZE);

  // фон-плашка в цвет сайта
  ctx.fillStyle = '#0a0a09';
  ctx.beginPath();
  ctx.roundRect(0, 0, SIZE, SIZE, 10);
  ctx.fill();

  // шина
  ctx.beginPath();
  ctx.arc(c, c, 26, 0, Math.PI * 2);
  ctx.fillStyle = '#1b1b1a';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#3a3938';
  ctx.stroke();

  // обод
  ctx.beginPath();
  ctx.arc(c, c, 19, 0, Math.PI * 2);
  ctx.strokeStyle = '#eceae5';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // спицы (5 штук, вращаются)
  ctx.save();
  ctx.translate(c, c);
  ctx.rotate(angle);
  ctx.strokeStyle = '#eceae5';
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    ctx.rotate((Math.PI * 2) / 5);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -18);
    ctx.stroke();
  }
  ctx.restore();

  // красная ступица
  ctx.beginPath();
  ctx.arc(c, c, 6.5, 0, Math.PI * 2);
  ctx.fillStyle = '#e01b22';
  ctx.fill();
}

export function initFavicon() {
  if (typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx || typeof ctx.roundRect !== 'function') return;

  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }

  let angle = 0;
  const tick = () => {
    if (document.hidden) return; // не жжём батарею на фоне
    angle += 0.45;
    drawWheel(ctx, angle);
    link!.href = canvas.toDataURL('image/png');
  };
  tick();
  window.setInterval(tick, 100);
}
