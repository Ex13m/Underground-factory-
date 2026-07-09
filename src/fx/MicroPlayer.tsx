/**
 * Микро-плеер UNDERGROUND FACTORY: треки играют в случайном порядке,
 * переходы — диджейские кроссфейды случайной длины (2–6 с): следующий
 * трек вступает, пока текущий ещё дозвучивает. Два <audio> работают
 * по очереди. Старт — только по клику (политика автоплея браузеров).
 */

import { useEffect, useRef, useState } from 'react';
import { PLAYLIST, type Track } from '../data/playlist';
import '../styles/player.css';

const VOLUME = 0.65;

function shuffled(list: Track[]): Track[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function MicroPlayer() {
  const [playing, setPlaying] = useState(false);
  const [title, setTitle] = useState<string>('');

  const aRef = useRef<HTMLAudioElement>(null);
  const bRef = useRef<HTMLAudioElement>(null);
  /** какой из двух <audio> сейчас ведущий */
  const activeRef = useRef<0 | 1>(0);
  const orderRef = useRef<Track[]>(shuffled(PLAYLIST));
  const posRef = useRef(0);
  const fadingRef = useRef(false);
  const rafRef = useRef(0);

  const els = () => [aRef.current!, bRef.current!] as const;

  const nextTrack = (): Track => {
    posRef.current += 1;
    if (posRef.current >= orderRef.current.length) {
      orderRef.current = shuffled(PLAYLIST); // новый круг — новый порядок
      posRef.current = 0;
    }
    return orderRef.current[posRef.current];
  };

  /** диджейский кроссфейд: следующий вступает, текущий уходит (2–6 с) */
  const crossfade = (toTrack: Track) => {
    const [a, b] = els();
    const cur = activeRef.current === 0 ? a : b;
    const nxt = activeRef.current === 0 ? b : a;
    const fade = 2 + Math.random() * 4;
    fadingRef.current = true;

    nxt.src = toTrack.url;
    nxt.volume = 0;
    nxt.play().catch(() => { /* трек не сыграл — пропустим на следующем тике */ });
    setTitle(toTrack.title);

    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / (fade * 1000));
      nxt.volume = VOLUME * k;
      cur.volume = VOLUME * (1 - k);
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

  // следим за хвостом трека: пора — начинаем кроссфейд в случайный момент
  useEffect(() => {
    if (!playing) return;
    const iv = window.setInterval(() => {
      const cur = activeRef.current === 0 ? aRef.current : bRef.current;
      if (!cur || fadingRef.current || !cur.duration) return;
      const left = cur.duration - cur.currentTime;
      if (left <= 2 + Math.random() * 4) crossfade(nextTrack());
    }, 500);
    return () => window.clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const toggle = () => {
    const [a] = els();
    if (!playing) {
      if (!a.src) {
        const first = orderRef.current[0];
        a.src = first.url;
        a.volume = VOLUME;
        setTitle(first.title);
      }
      const cur = activeRef.current === 0 ? aRef.current! : bRef.current!;
      cur.play().catch(() => { /* браузер не дал — юзер кликнет ещё раз */ });
      setPlaying(true);
    } else {
      els().forEach((el) => el.pause());
      setPlaying(false);
    }
  };

  const skip = () => {
    if (!playing) return;
    if (!fadingRef.current) crossfade(nextTrack());
  };

  return (
    <div className={`ufplayer${playing ? ' on' : ''}`} data-testid="ufplayer">
      <audio ref={aRef} preload="none" />
      <audio ref={bRef} preload="none" />
      <button className="ufplayer-btn" onClick={toggle} aria-label="play/pause">
        {playing ? '❚❚' : '▶'}
      </button>
      <div className="ufplayer-eq" aria-hidden>
        <i /><i /><i /><i />
      </div>
      <div className="ufplayer-title mono">{playing ? title : 'UF RADIO'}</div>
      <button className="ufplayer-btn" onClick={skip} aria-label="next" disabled={!playing}>
        ⏭
      </button>
    </div>
  );
}
