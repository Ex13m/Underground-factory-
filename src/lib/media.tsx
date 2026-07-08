/**
 * SmartMedia — все фото/видео сайта рендерятся через эти компоненты.
 * Если внешний URL недоступен (офлайн, блокировка, битая ссылка) —
 * вместо дыры рисуется сгенерированный декаль-арт в стиле сайта
 * (силуэт тачки, штрих-коды, тех-маркировка). Детерминирован по seed.
 */

import { useEffect, useMemo, useState } from 'react';
import { getOverride, onMediaChanged } from './mediaStore';

/** Подписка на оверрайд арт-редактора по ключу (= seed). */
function useMediaOverride(key: string) {
  const [, bump] = useState(0);
  useEffect(() => onMediaChanged(() => bump((n) => n + 1)), []);
  return getOverride(key);
}

// deterministic PRNG from a string seed
function mulberry(seedStr: string) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SILHOUETTES = [
  // low coupe
  'M20,155 L45,150 Q60,120 95,112 L130,92 Q170,78 225,82 L275,95 Q330,100 355,118 L378,140 Q385,148 382,155 L360,158 A20,20 0 0 0 320,158 L140,158 A20,20 0 0 0 100,158 L25,158 Z',
  // hatch / kei drift box
  'M25,155 L40,148 Q48,110 85,100 L120,88 Q160,80 200,84 L235,90 Q290,92 330,110 L370,142 Q378,150 372,156 L350,158 A19,19 0 0 0 312,158 L135,158 A19,19 0 0 0 97,158 L30,158 Z',
  // sedan with big wing
  'M18,152 L40,146 Q55,118 92,108 L128,90 Q168,78 218,82 L262,94 Q318,100 348,120 L372,140 L372,110 L384,108 L384,146 Q386,152 380,155 L358,158 A20,20 0 0 0 318,158 L142,158 A20,20 0 0 0 102,158 L22,158 Z',
];

const GLYPHS = ['未来', '軽量', '走れ', '軽い', '速い', '速い'];
const LABELS = ['PROTOTYPE', 'TYPE-A', 'PHASE—02', 'QC ▸ PASSED', 'FATAL ERROR', 'SPEC/UF', '404 KIT'];

export function genArt(seed: string, w = 800, h = 500): string {
  const rnd = mulberry(seed);
  const inverse = rnd() > 0.72; // occasionally paper-white plate
  const bg = inverse ? '#eceae5' : '#111110';
  const fg = inverse ? '#0a0a09' : '#eceae5';
  const red = '#e01b22';
  const sil = SILHOUETTES[Math.floor(rnd() * SILHOUETTES.length)];
  const glyph = GLYPHS[Math.floor(rnd() * GLYPHS.length)];
  const label = LABELS[Math.floor(rnd() * LABELS.length)];
  const code = Math.floor(rnd() * 900 + 100);

  let bars = '';
  let x = w - 150;
  for (let i = 0; i < 24; i++) {
    const bw = 1 + Math.floor(rnd() * 4);
    bars += `<rect x="${x}" y="${h - 46}" width="${bw}" height="26" fill="${fg}"/>`;
    x += bw + 1 + Math.floor(rnd() * 3);
  }

  let deco = '';
  for (let i = 0; i < 5; i++) {
    const dx = 20 + rnd() * (w - 120);
    const dy = 16 + rnd() * 60;
    deco += rnd() > 0.5
      ? `<rect x="${dx}" y="${dy}" width="${20 + rnd() * 60}" height="6" fill="${rnd() > 0.6 ? red : fg}" opacity="0.8"/>`
      : `<circle cx="${dx}" cy="${dy}" r="3" fill="none" stroke="${fg}" opacity="0.7"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 400 200">
  <rect width="400" height="200" fill="${bg}"/>
  <rect x="0" y="0" width="400" height="8" fill="${red}"/>
  <g opacity="0.16" font-family="sans-serif" font-weight="900" font-size="92">
    <text x="238" y="120" fill="${fg}">${glyph}</text>
  </g>
  <path d="${sil}" fill="${fg}" opacity="0.92"/>
  <circle cx="120" cy="158" r="13" fill="${bg}"/><circle cx="120" cy="158" r="6" fill="${red}"/>
  <circle cx="338" cy="158" r="13" fill="${bg}"/><circle cx="338" cy="158" r="6" fill="${red}"/>
  <g transform="scale(0.5)">${deco}</g>
  <g transform="translate(0,0) scale(0.5)">${bars}</g>
  <g font-family="monospace" font-size="10" fill="${fg}">
    <text x="14" y="22">UF—${code} // ${label}</text>
    <text x="14" y="188" opacity="0.6">UNDERGROUND FACTORY © CARBON DIV.</text>
  </g>
  <rect x="14" y="30" width="46" height="12" fill="${red}"/>
  <text x="17" y="40" font-family="monospace" font-size="9" fill="#fff">UF/KIT</text>
  <rect x="0.5" y="0.5" width="399" height="199" fill="none" stroke="${fg}" stroke-opacity="0.25"/>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function Img({
  src,
  seed,
  alt = '',
  className,
  style,
}: {
  src?: string;
  seed: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [failed, setFailed] = useState(false);
  const fallback = useMemo(() => genArt(seed), [seed]);
  const override = useMediaOverride(seed);
  return (
    <img
      src={override?.url ?? (failed || !src ? fallback : src)}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      onError={() => setFailed(true)}
      draggable={false}
      data-uf-media={seed}
      data-uf-kind="image"
    />
  );
}

/**
 * Фоновое видео: список источников — это ПЛЕЙЛИСТ (монтаж эпизодов):
 * ролики играют по очереди и зацикливаются по кругу; битый источник
 * выбывает из ротации. Если живых не осталось — арт-фолбэк.
 */
export function VideoBg({ sources, seed, className }: { sources: string[]; seed: string; className?: string }) {
  const [idx, setIdx] = useState(0);
  const [dead, setDead] = useState<ReadonlySet<number>>(new Set());
  const fallback = useMemo(() => genArt(seed, 1600, 900), [seed]);
  const override = useMediaOverride(seed);

  const alive = sources.map((_, i) => i).filter((i) => !dead.has(i));
  const nextAlive = (from: number) => {
    for (let step = 1; step <= sources.length; step++) {
      const i = (from + step) % sources.length;
      if (!dead.has(i)) return i;
    }
    return -1;
  };
  if (override?.kind === 'video') {
    return (
      <video
        key={override.url}
        className={className}
        src={override.url}
        autoPlay
        muted
        loop
        playsInline
        data-uf-media={seed}
        data-uf-kind="video"
      />
    );
  }
  if (override) {
    // сгенерированная картинка вместо видео-фона — статичный кадр в той же обёртке
    return (
      <div className={`videobg-fallback ${className ?? ''}`} aria-hidden data-uf-media={seed} data-uf-kind="video">
        <img src={override.url} alt="" />
        <div className="videobg-scan" />
      </div>
    );
  }
  if (alive.length === 0) {
    return (
      <div className={`videobg-fallback ${className ?? ''}`} aria-hidden data-uf-media={seed} data-uf-kind="video">
        <img src={fallback} alt="" />
        <div className="videobg-scan" />
      </div>
    );
  }
  const cur = dead.has(idx) ? nextAlive(idx) : idx;
  return (
    <video
      key={sources[cur]}
      className={className}
      src={sources[cur]}
      autoPlay
      muted
      // один живой ролик — обычный loop; несколько — монтаж по кругу
      loop={alive.length === 1}
      playsInline
      onEnded={() => setIdx(nextAlive(cur))}
      onError={() => {
        setDead((d) => new Set(d).add(cur));
        setIdx(nextAlive(cur));
      }}
      data-uf-media={seed}
      data-uf-kind="video"
    />
  );
}
