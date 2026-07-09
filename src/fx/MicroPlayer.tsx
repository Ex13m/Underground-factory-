/**
 * Микро-плеер UNDERGROUND FACTORY: треки в случайном порядке, переходы —
 * диджейские кроссфейды случайной длины (2–6 с). Два <audio> работают
 * по очереди. Автостарт: пробуем сразу; если браузер блокирует звук без
 * жеста — запускаемся при первом любом клике/клавише на странице.
 * Управление: play/pause, назад, вперёд, громкость, mute.
 */

import { useEffect, useRef, useState } from 'react';
import { PLAYLIST, type Track } from '../data/playlist';
import '../styles/player.css';

export function MicroPlayer() {
  const [playing, setPlaying] = useState(false);
  const [title, setTitle] = useState<string>('UF RADIO');
  const [volume, setVolume] = useState(0.65);
  const [muted, setMuted] = useState(false);

  const aRef = useRef<HTMLAudioElement>(null);
  const bRef = useRef<HTMLAudioElement>(null);
  /** какой из двух <audio> сейчас ведущий */
  const activeRef = useRef<0 | 1>(0);
  // случайный порядок, но первым всегда открывает BOOST ▸ II
  const orderRef = useRef<Track[]>(
    (() => {
      const s = shuffle(PLAYLIST);
      const i = s.findIndex((t) => t.url.endsWith('boost-b.mp3'));
      if (i > 0) s.unshift(s.splice(i, 1)[0]);
      return s;
    })(),
  );
  const posRef = useRef(0);
  const historyRef = useRef<Track[]>([]);
  const fadingRef = useRef(false);
  const rafRef = useRef(0);
  const startedRef = useRef(false);
  /** актуальная громкость для rAF-кроссфейда */
  const volRef = useRef(volume);
  const mutedRef = useRef(muted);

  function shuffle(list: Track[]): Track[] {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const master = () => (mutedRef.current ? 0 : volRef.current);
  const curEl = () => (activeRef.current === 0 ? aRef.current! : bRef.current!);
  const nxtEl = () => (activeRef.current === 0 ? bRef.current! : aRef.current!);

  // громкость/мьют применяются к ведущему прямо на лету
  useEffect(() => {
    volRef.current = volume;
    mutedRef.current = muted;
    if (!fadingRef.current && aRef.current && bRef.current) curEl().volume = master();
  }, [volume, muted]);

  const nextTrack = (): Track => {
    historyRef.current.push(orderRef.current[posRef.current]);
    if (historyRef.current.length > 50) historyRef.current.shift();
    posRef.current += 1;
    if (posRef.current >= orderRef.current.length) {
      orderRef.current = shuffle(PLAYLIST); // новый круг — новый порядок
      posRef.current = 0;
    }
    return orderRef.current[posRef.current];
  };

  /** нормальный переход: ровный кроссфейд фиксированной длины */
  const FADE_SEC = 1.5;

  /** диджейский кроссфейд equal-power: без провала громкости в середине */
  const crossfade = (toTrack: Track, fadeSec?: number) => {
    const cur = curEl();
    const nxt = nxtEl();
    const fade = Math.max(0.5, fadeSec ?? FADE_SEC);
    fadingRef.current = true;

    nxt.src = toTrack.url;
    nxt.volume = 0;
    nxt.play().catch(() => { /* не сыграл — подхватим на следующем тике */ });
    setTitle(toTrack.title);

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
        activeRef.current = activeRef.current === 0 ? 1 : 0;
        fadingRef.current = false;
      }
    };
    rafRef.current = requestAnimationFrame(step);
  };

  /** запуск: ставит первый трек (BOOST ▸ II) и играет; успех — только
      когда звук реально пошёл (промис play() разрешился) */
  const start = () => {
    const a = aRef.current;
    if (!a || startedRef.current) return;
    if (!a.src) {
      const first = orderRef.current[0];
      a.src = first.url;
      a.volume = master();
      setTitle(first.title);
    }
    a.play()
      .then(() => {
        startedRef.current = true;
        setPlaying(true);
      })
      .catch(() => { /* заблокировано — попробуем на следующем жесте */ });
  };

  // автостарт: пробуем сразу; дальше ДОБИВАЕМСЯ запуска на каждом жесте,
  // пока звук не пошёл (после ручной паузы юзера больше не навязываемся)
  const userPausedRef = useRef(false);
  useEffect(() => {
    start();
    const onGesture = () => {
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

  // хвост трека → ровный кроссфейд в самом конце, текущий дозвучивает полностью
  useEffect(() => {
    if (!playing) return;
    const iv = window.setInterval(() => {
      const cur = curEl();
      if (!cur || fadingRef.current || !cur.duration) return;
      const left = cur.duration - cur.currentTime;
      if (left <= FADE_SEC) crossfade(nextTrack(), Math.max(0.5, left - 0.1));
    }, 250);
    return () => window.clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

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
