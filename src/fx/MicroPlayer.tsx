/**
 * Микро-плеер UNDERGROUND FACTORY: треки в случайном порядке, переходы —
 * ровные кроссфейды equal-power (два <audio> по очереди). Автостарт: пробуем
 * сразу; если браузер блокирует звук без жеста — запускаемся при первом клике.
 * Управление: play/pause, назад, вперёд, громкость, mute.
 *
 * Музыкальный цех (store/radio + Админка → РАДИО):
 * - плейлист = сид-треки + загруженные mp3, у которых onAir !== false;
 *   первым стартует store.first (по умолчанию boost-b.mp3);
 * - trims: трек играет только отрезок [start, end] — старт с start,
 *   кроссфейд у end;
 * - мастеринг (Web Audio, на лету): MediaElementSource → lowshelf 120 Гц →
 *   peaking 1 кГц → highshelf 8 кГц → DynamicsCompressor → per-track gain →
 *   выходной gain → destination. Настройки из store.master; выключен —
 *   цепочка нейтральна (гейны 0 дБ, компрессор 0/1);
 * - псевдо-LUFS: при первом проигрывании трека меряем средний RMS через
 *   AnalyserNode (~5 с) и сохраняем per-track gain к целевому уровню
 *   (store.trackGain) — треки звучат ровно.
 */

import { useEffect, useRef, useState } from 'react';
import { onAirTracks, type RadioTrack } from '../lib/radioTracks';
import { onMediaChanged } from '../lib/mediaStore';
import { useRadio, DEFAULT_FIRST } from '../store/radio';
import '../styles/player.css';

const dbToLin = (db: number) => Math.pow(10, db / 20);
/** целевой средний RMS (~-18 dBFS) для выравнивания громкости */
const TARGET_RMS = 0.125;

interface Chain {
  analyser: AnalyserNode;
  bass: BiquadFilterNode;
  mid: BiquadFilterNode;
  treble: BiquadFilterNode;
  comp: DynamicsCompressorNode;
  trackGain: GainNode;
  out: GainNode;
}

function shuffle(list: RadioTrack[]): RadioTrack[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** свежий случайный порядок; placeFirst — трек store.first в начало */
function buildOrder(placeFirst: boolean): RadioTrack[] {
  const st = useRadio.getState();
  const s = shuffle(onAirTracks(st.onAir));
  if (placeFirst) {
    const fid = st.first ?? DEFAULT_FIRST;
    const i = s.findIndex((t) => t.id === fid);
    if (i > 0) s.unshift(s.splice(i, 1)[0]);
  }
  return s;
}

export function MicroPlayer() {
  const [playing, setPlaying] = useState(false);
  const [title, setTitle] = useState<string>('UF RADIO');
  const [volume, setVolume] = useState(0.65);
  const [muted, setMuted] = useState(false);

  const aRef = useRef<HTMLAudioElement>(null);
  const bRef = useRef<HTMLAudioElement>(null);
  /** какой из двух <audio> сейчас ведущий */
  const activeRef = useRef<0 | 1>(0);
  const orderRef = useRef<RadioTrack[]>(buildOrder(true));
  const posRef = useRef(0);
  /** что играет прямо сейчас (порядок может пересобираться на лету) */
  const currentRef = useRef<RadioTrack | null>(null);
  /** какой трек заряжен в каждый из двух <audio> (для per-track gain) */
  const elTrackRef = useRef<Array<RadioTrack | null>>([null, null]);
  const historyRef = useRef<RadioTrack[]>([]);
  const fadingRef = useRef(false);
  const rafRef = useRef(0);
  const startedRef = useRef(false);
  /** актуальная громкость для rAF-кроссфейда */
  const volRef = useRef(volume);
  const mutedRef = useRef(muted);

  // ---- Web Audio: мастеринг-цепочка на каждый <audio> ----
  const ctxRef = useRef<AudioContext | null>(null);
  const chainsRef = useRef<Array<Chain | null>>([null, null]);
  const measureRef = useRef<{ sum: number; n: number; iv: number } | null>(null);

  const master = () => (mutedRef.current ? 0 : volRef.current);
  const curEl = () => (activeRef.current === 0 ? aRef.current! : bRef.current!);
  const nxtEl = () => (activeRef.current === 0 ? bRef.current! : aRef.current!);

  // громкость/мьют применяются к ведущему прямо на лету
  useEffect(() => {
    volRef.current = volume;
    mutedRef.current = muted;
    if (!fadingRef.current && aRef.current && bRef.current) curEl().volume = master();
  }, [volume, muted]);

  /** применить настройки мастеринга и per-track gain ко всем цепочкам */
  const applyMasterToChains = () => {
    const st = useRadio.getState();
    const m = st.master;
    chainsRef.current.forEach((ch, i) => {
      if (!ch) return;
      if (m.enabled) {
        ch.bass.gain.value = m.bassDb;
        ch.mid.gain.value = m.midDb;
        ch.treble.gain.value = m.trebleDb;
        ch.comp.threshold.value = Math.max(-100, Math.min(0, m.compThreshold));
        ch.comp.ratio.value = Math.max(1, Math.min(20, m.compRatio));
        ch.comp.knee.value = 6;
        ch.comp.attack.value = 0.008;
        ch.comp.release.value = 0.25;
        ch.out.gain.value = dbToLin(m.gain);
        const id = elTrackRef.current[i]?.id;
        ch.trackGain.gain.value = dbToLin(id !== undefined ? st.trackGain[id] ?? 0 : 0);
      } else {
        // выключен — цепочка полностью нейтральна
        ch.bass.gain.value = 0;
        ch.mid.gain.value = 0;
        ch.treble.gain.value = 0;
        ch.comp.threshold.value = 0;
        ch.comp.ratio.value = 1;
        ch.comp.knee.value = 0;
        ch.out.gain.value = 1;
        ch.trackGain.gain.value = 1;
      }
    });
  };

  /** построить граф один раз; без Web Audio плеер работает как обычно */
  const ensureGraph = () => {
    if (ctxRef.current) return;
    const AC: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    try {
      const ctx = new AC();
      [aRef.current, bRef.current].forEach((el, i) => {
        if (!el) return;
        const src = ctx.createMediaElementSource(el);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        const bass = ctx.createBiquadFilter();
        bass.type = 'lowshelf';
        bass.frequency.value = 120;
        const mid = ctx.createBiquadFilter();
        mid.type = 'peaking';
        mid.frequency.value = 1000;
        mid.Q.value = 0.9;
        const treble = ctx.createBiquadFilter();
        treble.type = 'highshelf';
        treble.frequency.value = 8000;
        const comp = ctx.createDynamicsCompressor();
        const trackGain = ctx.createGain();
        const out = ctx.createGain();
        src.connect(analyser); // отвод на замер RMS, в звуковой путь не входит
        src.connect(bass);
        bass.connect(mid);
        mid.connect(treble);
        treble.connect(comp);
        comp.connect(trackGain);
        trackGain.connect(out);
        out.connect(ctx.destination);
        chainsRef.current[i] = { analyser, bass, mid, treble, comp, trackGain, out };
      });
      ctxRef.current = ctx;
      applyMasterToChains();
    } catch {
      ctxRef.current = null; // не вышло — звук идёт напрямую, без мастеринга
    }
  };

  /** AudioContext стартует suspended до жеста — будим при каждом удобном случае */
  const resumeCtx = () => {
    const ctx = ctxRef.current;
    if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
  };

  /** зарядить трек в <audio>: src, per-track gain, старт с trims.start */
  const assignTrack = (el: HTMLAudioElement, idx: 0 | 1, track: RadioTrack) => {
    elTrackRef.current[idx] = track;
    const st = useRadio.getState();
    const ch = chainsRef.current[idx];
    if (ch) ch.trackGain.gain.value = st.master.enabled ? dbToLin(st.trackGain[track.id] ?? 0) : 1;
    el.src = track.url;
    const start = st.trims[track.id]?.start ?? 0;
    if (start > 0.05) {
      const seek = () => {
        try { el.currentTime = start; } catch { /* метаданных ещё нет — не страшно */ }
      };
      if (el.readyState >= 1) seek();
      else el.addEventListener('loadedmetadata', seek, { once: true });
    }
  };

  /** конец трека с учётом локальной обрезки */
  const effectiveEnd = (el: HTMLAudioElement, track: RadioTrack | null): number => {
    const dur = el.duration;
    if (!dur || !isFinite(dur)) return NaN;
    const tr = track ? useRadio.getState().trims[track.id] : undefined;
    if (tr && tr.end > tr.start + 1 && tr.end < dur) return tr.end;
    return dur;
  };

  // ---- псевдо-LUFS: замер среднего RMS первого проигрывания ----
  const stopMeasure = () => {
    if (measureRef.current) {
      window.clearInterval(measureRef.current.iv);
      measureRef.current = null;
    }
  };

  const beginMeasure = (track: RadioTrack) => {
    stopMeasure();
    const st = useRadio.getState();
    if (!st.master.enabled || st.trackGain[track.id] !== undefined) return; // уже замерен
    const ch = chainsRef.current[activeRef.current];
    if (!ch) return;
    const buf = new Float32Array(ch.analyser.fftSize);
    const iv = window.setInterval(() => {
      const m = measureRef.current;
      const el = curEl();
      if (!m || !el || el.paused || fadingRef.current) return;
      const vol = el.volume;
      if (vol < 0.05) return; // почти mute — замер не честный
      ch.analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      // MediaElementSource отдаёт сигнал уже с учётом volume — снимаем его
      const rms = Math.sqrt(sum / buf.length) / vol;
      if (rms < 0.001) return; // тишина — пропускаем
      m.sum += rms;
      m.n += 1;
      if (m.n >= 20) {
        // ~5 c набрали: средний RMS → поправка к целевому уровню
        const db = Math.max(-12, Math.min(9, 20 * Math.log10(TARGET_RMS / (m.sum / m.n))));
        useRadio.getState().setTrackGain(track.id, Math.round(db * 10) / 10);
        stopMeasure(); // subscribe ниже применит гейн к цепочке сам
      }
    }, 250);
    measureRef.current = { sum: 0, n: 0, iv };
  };

  const nextTrack = (): RadioTrack => {
    if (currentRef.current) {
      historyRef.current.push(currentRef.current);
      if (historyRef.current.length > 50) historyRef.current.shift();
    }
    if (posRef.current >= orderRef.current.length) {
      orderRef.current = buildOrder(false); // новый круг — новый порядок
      posRef.current = 0;
    }
    let t = orderRef.current[posRef.current];
    posRef.current += 1;
    // после пересборки порядка не повторяем текущий трек дважды подряд
    if (t && currentRef.current && t.id === currentRef.current.id && orderRef.current.length > 1) {
      if (posRef.current >= orderRef.current.length) posRef.current = 0;
      t = orderRef.current[posRef.current];
      posRef.current += 1;
    }
    return t ?? currentRef.current!;
  };

  /** нормальный переход: ровный кроссфейд фиксированной длины */
  const FADE_SEC = 1.5;

  /** диджейский кроссфейд equal-power: без провала громкости в середине */
  const crossfade = (toTrack: RadioTrack, fadeSec?: number) => {
    const cur = curEl();
    const nxt = nxtEl();
    const nxtIdx: 0 | 1 = activeRef.current === 0 ? 1 : 0;
    const fade = Math.max(0.5, fadeSec ?? FADE_SEC);
    fadingRef.current = true;
    stopMeasure();
    resumeCtx();

    assignTrack(nxt, nxtIdx, toTrack);
    nxt.volume = 0;
    nxt.play().catch(() => { /* не сыграл — подхватим на следующем тике */ });
    setTitle(toTrack.title);
    currentRef.current = toTrack;

    cancelAnimationFrame(rafRef.current);
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / (fade * 1000));
      // equal-power: сумма энергий постоянна — переход слитный, без «ямы»
      nxt.volume = master() * Math.sin((k * Math.PI) / 2);
      cur.volume = master() * Math.cos((k * Math.PI) / 2);
      if (k < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        cur.pause();
        activeRef.current = nxtIdx;
        fadingRef.current = false;
        beginMeasure(toTrack);
      }
    };
    rafRef.current = requestAnimationFrame(step);
  };

  /** запуск: ставит первый трек (store.first) и играет; успех — только
      когда звук реально пошёл (промис play() разрешился) */
  const start = () => {
    const a = aRef.current;
    if (!a || startedRef.current) return;
    ensureGraph();
    resumeCtx();
    if (!currentRef.current) {
      const first = orderRef.current[0];
      if (!first) return;
      posRef.current = 1;
      assignTrack(a, 0, first);
      a.volume = master();
      setTitle(first.title);
      currentRef.current = first;
    }
    a.play()
      .then(() => {
        startedRef.current = true;
        setPlaying(true);
        resumeCtx();
        if (currentRef.current) beginMeasure(currentRef.current);
      })
      .catch(() => { /* заблокировано — попробуем на следующем жесте */ });
  };

  // автостарт: пробуем сразу; дальше ДОБИВАЕМСЯ запуска на каждом жесте,
  // пока звук не пошёл (после ручной паузы юзера больше не навязываемся)
  const userPausedRef = useRef(false);
  useEffect(() => {
    start();
    const onGesture = () => {
      resumeCtx(); // жест — легальный момент разбудить AudioContext
      if (!startedRef.current && !userPausedRef.current) start();
    };
    window.addEventListener('pointerdown', onGesture, true);
    window.addEventListener('keydown', onGesture, true);
    window.addEventListener('touchstart', onGesture, true);
    return () => {
      window.removeEventListener('pointerdown', onGesture, true);
      window.removeEventListener('keydown', onGesture, true);
      window.removeEventListener('touchstart', onGesture, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // реакция на музыкальный цех: эфир/первый трек — пересобрать порядок;
  // мастеринг/выравнивание — применить к цепочкам на лету
  useEffect(() => {
    const rebuild = () => {
      orderRef.current = buildOrder(!startedRef.current);
      posRef.current = 0;
    };
    const offMedia = onMediaChanged(rebuild); // загруженные mp3 подъехали
    const unsub = useRadio.subscribe((s, prev) => {
      if (s.onAir !== prev.onAir || s.first !== prev.first) rebuild();
      if (s.master !== prev.master || s.trackGain !== prev.trackGain) applyMasterToChains();
    });
    return () => {
      offMedia();
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // хвост трека (или границы обрезки) → ровный кроссфейд в самом конце
  useEffect(() => {
    if (!playing) return;
    const iv = window.setInterval(() => {
      const cur = curEl();
      if (!cur || fadingRef.current) return;
      const end = effectiveEnd(cur, currentRef.current);
      if (!isFinite(end)) return;
      const left = end - cur.currentTime;
      if (left <= FADE_SEC) crossfade(nextTrack(), Math.max(0.5, Math.min(FADE_SEC, left) - 0.1));
    }, 250);
    return () => window.clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      stopMeasure();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const toggle = () => {
    if (!startedRef.current) {
      start();
      return;
    }
    if (playing) {
      userPausedRef.current = true; // юзер сам выключил — не навязываемся
      curEl().pause();
      nxtEl().pause();
      setPlaying(false);
    } else {
      userPausedRef.current = false;
      resumeCtx();
      curEl().play().catch(() => {});
      setPlaying(true);
    }
  };

  const skipNext = () => {
    if (!startedRef.current || fadingRef.current) return;
    crossfade(nextTrack(), 0.8);
  };

  const skipBack = () => {
    if (!startedRef.current || fadingRef.current) return;
    const prev = historyRef.current.pop();
    if (!prev) return;
    // возвращаем позицию: prev снова станет «текущим» в порядке истории
    crossfade(prev, 0.8);
  };

  return (
    <div className={`ufplayer${playing ? ' on' : ''}`} data-testid="ufplayer">
      <audio ref={aRef} preload="auto" />
      <audio ref={bRef} preload="none" />
      <button className="ufplayer-btn" onClick={skipBack} aria-label="prev" disabled={!playing}>
        ⏮
      </button>
      <button className="ufplayer-btn" onClick={toggle} aria-label="play/pause">
        {playing ? '❚❚' : '▶'}
      </button>
      <button className="ufplayer-btn" onClick={skipNext} aria-label="next" disabled={!playing}>
        ⏭
      </button>
      <div className="ufplayer-eq" aria-hidden>
        <i /><i /><i /><i />
      </div>
      <div className="ufplayer-title mono">{title}</div>
      <button
        className={`ufplayer-btn${muted ? ' muted' : ''}`}
        onClick={() => setMuted((m) => !m)}
        aria-label="mute"
      >
        {muted ? '🔇' : '🔊'}
      </button>
      <input
        className="ufplayer-vol"
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
        aria-label="volume"
      />
    </div>
  );
}
