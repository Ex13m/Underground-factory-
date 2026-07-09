/**
 * Замер интегральной громкости трека (LUFS) по ITU-R BS.1770:
 * K-взвешивание (полка +4 дБ ~1.68 кГц + срез низа 38 Гц) → средняя мощность
 * в блоках 400 мс с перекрытием 75% → двойной гейтинг (абсолютный −70 LUFS,
 * относительный −10 LU). Точность бытовая (полки WebAudio ≈ спецификации),
 * для выравнивания эфира под целевой LUFS — более чем достаточно.
 */

/** энергетическое среднее мощностей → LUFS */
const toLufs = (meanPower: number) => -0.691 + 10 * Math.log10(meanPower + 1e-12);

export async function measureLufs(url: string): Promise<number> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const raw = await res.arrayBuffer();

  // decodeAudioData стабильнее у обычного AudioContext
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const probe = new Ctor();
  let audio: AudioBuffer;
  try {
    audio = await probe.decodeAudioData(raw);
  } finally {
    void probe.close();
  }

  // K-взвешивание офлайн-рендером
  const off = new OfflineAudioContext(audio.numberOfChannels, audio.length, audio.sampleRate);
  const src = off.createBufferSource();
  src.buffer = audio;
  const shelf = off.createBiquadFilter();
  shelf.type = 'highshelf';
  shelf.frequency.value = 1681.97;
  shelf.gain.value = 4;
  const rlb = off.createBiquadFilter();
  rlb.type = 'highpass';
  rlb.frequency.value = 38.13;
  rlb.Q.value = 0.5;
  src.connect(shelf);
  shelf.connect(rlb);
  rlb.connect(off.destination);
  src.start();
  const k = await off.startRendering();

  // мощность по под-блокам 100 мс (каждый сэмпл считается один раз),
  // блок 400 мс = 4 подряд идущих под-блока → перекрытие 75% бесплатно
  const hop = Math.max(1, Math.round(0.1 * k.sampleRate));
  const hops = Math.floor(k.length / hop);
  if (hops < 4) return -70;

  const hopPower = new Float64Array(hops); // сумма по каналам средних квадратов
  for (let c = 0; c < k.numberOfChannels; c++) {
    const data = k.getChannelData(c);
    for (let h = 0; h < hops; h++) {
      let s = 0;
      const base = h * hop;
      for (let i = 0; i < hop; i++) {
        const v = data[base + i];
        s += v * v;
      }
      hopPower[h] += s / hop;
    }
  }

  const powers: number[] = [];
  const louds: number[] = [];
  for (let h = 0; h + 4 <= hops; h++) {
    const p = (hopPower[h] + hopPower[h + 1] + hopPower[h + 2] + hopPower[h + 3]) / 4;
    powers.push(p);
    louds.push(toLufs(p));
  }

  // гейтинг: абсолютный порог −70 LUFS
  let kept = powers.filter((_, i) => louds[i] > -70);
  if (!kept.length) return -70;
  // относительный: −10 LU от среднего по выжившим
  const rel = toLufs(kept.reduce((a, b) => a + b, 0) / kept.length) - 10;
  const kept2 = powers.filter((_, i) => louds[i] > -70 && louds[i] > rel);
  kept = kept2.length ? kept2 : kept;

  return toLufs(kept.reduce((a, b) => a + b, 0) / kept.length);
}

/** поправка громкости трека под целевой LUFS, зажата в разумные рамки */
export function gainForTarget(measuredLufs: number, targetLufs: number): number {
  return Math.max(-12, Math.min(9, targetLufs - measuredLufs));
}
