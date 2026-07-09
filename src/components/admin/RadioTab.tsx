/**
 * Вкладка РАДИО — музыкальный цех.
 * - список треков (сид + загруженные): эфир, «первым», прослушка;
 * - загрузка mp3: файл в IndexedDB (mediaStore, kind='audio') → сразу в радио;
 *   ≤4.5 МБ — публикация на прод (/api/track) + заявка add-track в /api/queue,
 *   больше — трек остаётся локальным (подсказка «передай файл Claude в чате»);
 * - панель прослушки: перемотка, обрезка start/end (локально → store.trims,
 *   радио её уважает), «насовсем» — заявка trim-audio, стемы — stems-audio;
 * - мастеринг: пресеты/ручные слайдеры (применяет fx/MicroPlayer через Web Audio).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useRadio, isOnAir, type MasterPreset, type MasterSettings } from '../../store/radio';
import { allTracks, AUDIO_PREFIX, type RadioTrack } from '../../lib/radioTracks';
import { setOverride, onMediaChanged } from '../../lib/mediaStore';
import { measureLufs, gainForTarget } from '../../lib/loudness';
import '../../styles/radioadmin.css';

type SendState = 'sending' | 'ok' | 'err';

const MAX_PUBLISH = Math.floor(4.5 * 1024 * 1024);

const fmtDur = (sec?: number) => {
  if (!sec || !isFinite(sec)) return '—:—';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

const fileToBase64 = (f: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(f);
  });

const postQueue = (key: string, kind: string, prompt: string) =>
  fetch('/api/queue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, kind, prompt, width: 0, height: 0, createdAt: Date.now() }),
  });

/* ================= панель прослушки одного трека ================= */

function TrackPlayer({ track, onClose }: { track: RadioTrack; onClose: () => void }) {
  const { t } = useI18n();
  const savedTrim = useRadio((s) => s.trims[track.id]);
  const setTrim = useRadio((s) => s.setTrim);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [dur, setDur] = useState(0);
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [start, setStart] = useState(savedTrim?.start ?? 0);
  const [end, setEnd] = useState(savedTrim?.end ?? 0);
  const [sent, setSent] = useState<Record<string, SendState>>({});

  // смена трека — панель заряжается заново
  useEffect(() => {
    const tr = useRadio.getState().trims[track.id];
    setStart(tr?.start ?? 0);
    setEnd(tr?.end ?? 0);
    setPos(0);
    setDur(0);
    setSent({});
  }, [track.id]);

  const onMeta = () => {
    const a = audioRef.current;
    if (!a || !isFinite(a.duration)) return;
    setDur(a.duration);
    setEnd((e) => (e > 0 && e <= a.duration ? e : a.duration));
  };

  const onTime = () => {
    const a = audioRef.current;
    if (!a) return;
    setPos(a.currentTime);
    // прослушка уважает границы обрезки
    if (end > start && a.currentTime >= end && !a.paused) a.pause();
  };

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      if (a.currentTime < start || (end > start && a.currentTime >= end - 0.2)) a.currentTime = start;
      a.play().catch(() => {});
    } else {
      a.pause();
    }
  };

  const seek = (v: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = v;
    setPos(v);
  };

  const trimValid = dur > 0 && end > start + 1;
  const applyTrim = () => {
    if (!trimValid) return;
    setTrim(track.id, { start: Math.max(0, Math.round(start * 10) / 10), end: Math.round(end * 10) / 10 });
  };
  const resetTrim = () => {
    setTrim(track.id, null);
    setStart(0);
    setEnd(dur);
  };

  const order = (kind: 'trim-audio' | 'stems-audio') => {
    const prompt =
      kind === 'trim-audio'
        ? `обрезать трек насовсем: start=${start.toFixed(1)}s end=${end.toFixed(1)}s (длина ${dur.toFixed(1)}s)`
        : 'разложить трек на стемы (drums / bass / melody / vocals)';
    setSent((s) => ({ ...s, [kind]: 'sending' }));
    postQueue(`/media/music/${track.id}`, kind, prompt)
      .then((r) => setSent((s) => ({ ...s, [kind]: r.ok ? 'ok' : 'err' })))
      .catch(() => setSent((s) => ({ ...s, [kind]: 'err' })));
  };

  const qStatus = (kind: string) => {
    const st = sent[kind];
    if (!st) return null;
    return (
      <span className={`radm-q-status${st === 'err' ? ' err' : ''}`}>
        {st === 'sending' && t('radio.q.sending')}
        {st === 'ok' && t('radio.q.ok')}
        {st === 'err' && t('radio.q.err')}
      </span>
    );
  };

  return (
    <div className="panel rivets radm-player" data-testid="radio-player">
      <audio
        ref={audioRef}
        src={track.url}
        preload="metadata"
        onLoadedMetadata={onMeta}
        onTimeUpdate={onTime}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <div className="radm-player-head">
        <span className="tape dark">{t('radio.player.title', { name: track.title })}</span>
        <button className="adm-mini-btn" style={{ marginLeft: 'auto' }} onClick={onClose}>
          {t('radio.player.close')}
        </button>
      </div>

      <div className="radm-transport">
        <button className="radm-play-btn on" onClick={toggle} aria-label="play/pause">
          {playing ? '❚❚' : '▶'}
        </button>
        <span className="radm-time mono">{fmtDur(pos)} / {fmtDur(dur)}</span>
      </div>
      <div className="radm-slider">
        <span>{t('radio.player.pos')}</span>
        <input
          type="range"
          min={0}
          max={Math.max(dur, 1)}
          step={0.1}
          value={Math.min(pos, dur || 0)}
          onChange={(e) => seek(Number(e.target.value))}
        />
        <span className="radm-val">{fmtDur(pos)}</span>
      </div>

      <div className="adm-block-title" style={{ marginTop: 14 }}>
        <span className="tech-label">{t('radio.trim.title')}</span>
      </div>
      <div className="radm-slider">
        <span>{t('radio.trim.start')}</span>
        <input
          type="range"
          min={0}
          max={Math.max(dur, 1)}
          step={0.1}
          value={start}
          onChange={(e) => setStart(Math.min(Number(e.target.value), Math.max(0, end - 1)))}
        />
        <span className="radm-val">{start.toFixed(1)}s</span>
      </div>
      <div className="radm-slider">
        <span>{t('radio.trim.end')}</span>
        <input
          type="range"
          min={0}
          max={Math.max(dur, 1)}
          step={0.1}
          value={end}
          onChange={(e) => setEnd(Math.max(Number(e.target.value), start + 1))}
        />
        <span className="radm-val">{end.toFixed(1)}s</span>
      </div>

      <div className="radm-actions">
        <button className="adm-mini-btn" onClick={applyTrim} disabled={!trimValid}>
          {t('radio.trim.apply')}
        </button>
        <button className="adm-mini-btn" onClick={resetTrim} disabled={!savedTrim}>
          {t('radio.trim.reset')}
        </button>
        <button className="adm-mini-btn danger" onClick={() => order('trim-audio')} disabled={!trimValid}>
          {t('radio.cut')}
        </button>
        {qStatus('trim-audio')}
        <button className="adm-mini-btn" onClick={() => order('stems-audio')}>
          {t('radio.stems')}
        </button>
        {qStatus('stems-audio')}
      </div>
      {savedTrim && (
        <div className="radm-trim-note">
          {t('radio.trim.saved', { start: savedTrim.start.toFixed(1), end: savedTrim.end.toFixed(1) })}
        </div>
      )}
    </div>
  );
}

/* ================= пульт мастеринга ================= */

function MasterPanel() {
  const { t } = useI18n();
  const master = useRadio((s) => s.master);
  const setMaster = useRadio((s) => s.setMaster);
  const applyPreset = useRadio((s) => s.applyPreset);
  const trackLufs = useRadio((s) => s.trackLufs);
  const setTrackLufs = useRadio((s) => s.setTrackLufs);
  const setTrackGain = useRadio((s) => s.setTrackGain);
  /** прогресс выравнивания: null — не идёт, иначе «n/m» */
  const [leveling, setLeveling] = useState<string | null>(null);
  const [levelDone, setLevelDone] = useState<string | null>(null);

  const targetLufs = master.targetLufs ?? -14;

  // движение любого слайдера переводит пресет в «ручной»
  const manual = (patch: Partial<MasterSettings>) => setMaster({ ...patch, preset: 'manual' });

  /** смена цели: пересчитать поправки всем уже замеренным трекам */
  const retarget = (target: number) => {
    setMaster({ targetLufs: target });
    for (const [id, lufs] of Object.entries(useRadio.getState().trackLufs)) {
      setTrackGain(id, gainForTarget(lufs, target));
    }
  };

  /** замер BS.1770 всех треков по очереди + поправка под цель */
  const levelAll = async () => {
    if (leveling) return;
    setLevelDone(null);
    const tracks = allTracks();
    let fails = 0;
    for (let i = 0; i < tracks.length; i++) {
      setLeveling(`${i + 1}/${tracks.length}`);
      try {
        const lufs = trackLufs[tracks[i].id] ?? (await measureLufs(tracks[i].url));
        setTrackLufs(tracks[i].id, lufs);
        setTrackGain(tracks[i].id, gainForTarget(lufs, useRadio.getState().master.targetLufs ?? -14));
      } catch {
        fails++;
      }
    }
    setLeveling(null);
    setLevelDone(fails ? t('radio.master.levelerr', { n: fails }) : t('radio.master.leveldone'));
  };

  const slider = (
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    onChange: (v: number) => void,
    unit = ' дБ',
  ) => (
    <div className="radm-slider">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <span className="radm-val">
        {value > 0 && unit !== ':1' ? '+' : ''}{value}{unit}
      </span>
    </div>
  );

  const presets: Array<Exclude<MasterPreset, 'manual'>> = ['hifi', 'club', 'radio'];

  /** АВТОМАСТЕРИНГ: единый стандарт эфира одним нажатием —
      пресет «авто» (эхо, объём, лимитер, срез гула) + выравнивание LUFS */
  const autoMaster = () => {
    applyPreset('auto');
    void levelAll();
  };

  return (
    <div className={`panel rivets radm-master${master.enabled ? '' : ' off'}`} style={{ padding: 18 }}>
      <div className="radm-master-head">
        <span className="tape dark">{t('radio.master.title')}</span>
        <label className="adm-check">
          <input type="checkbox" checked={master.enabled} onChange={(e) => setMaster({ enabled: e.target.checked })} />
          {t('radio.master.on')}
        </label>
        <button
          className="btn"
          onClick={autoMaster}
          disabled={!!leveling}
          style={master.preset === 'auto' ? { background: 'var(--blood)', borderColor: 'var(--blood)', color: '#fff' } : undefined}
          data-testid="radio-automaster"
        >
          {leveling ? t('radio.master.leveling', { p: leveling }) : t('radio.master.auto')}
        </button>
        <div className="radm-presets" style={{ marginLeft: 'auto' }}>
          <span className="tech-label">{t('radio.master.preset')} ▸</span>
          {presets.map((p) => (
            <button
              key={p}
              className={`adm-mini-btn${master.preset === p ? ' danger on' : ''}`}
              style={master.preset === p ? { background: 'var(--blood)', borderColor: 'var(--blood)', color: '#fff' } : undefined}
              onClick={() => applyPreset(p)}
            >
              {t(`radio.master.${p}`)}
            </button>
          ))}
          <button
            className="adm-mini-btn"
            style={master.preset === 'manual' ? { background: 'var(--blood)', borderColor: 'var(--blood)', color: '#fff' } : undefined}
            onClick={() => setMaster({ preset: 'manual' })}
          >
            {t('radio.master.manual')}
          </button>
        </div>
      </div>

      <div className="radm-master-grid">
        {slider(t('radio.master.bass'), master.bassDb, -8, 8, 0.5, (v) => manual({ bassDb: v }))}
        {slider(t('radio.master.mid'), master.midDb, -8, 8, 0.5, (v) => manual({ midDb: v }))}
        {slider(t('radio.master.treble'), master.trebleDb, -8, 8, 0.5, (v) => manual({ trebleDb: v }))}
        {slider(t('radio.master.thresh'), master.compThreshold, -60, 0, 1, (v) => manual({ compThreshold: v }))}
        {slider(t('radio.master.ratio'), master.compRatio, 1, 12, 0.5, (v) => manual({ compRatio: v }), ':1')}
        {slider(t('radio.master.gain'), master.gain, -12, 12, 0.5, (v) => manual({ gain: v }))}
        {slider(t('radio.master.echo'), master.reverbWet ?? 0, 0, 0.4, 0.02, (v) => manual({ reverbWet: v }), '')}
        {slider(t('radio.master.width'), master.width ?? 1, 1, 2, 0.05, (v) => manual({ width: v }), '×')}
      </div>
      <div className="radm-lufs" style={{ borderTop: 'none', marginTop: 4, paddingTop: 0 }}>
        <label className="adm-check">
          <input type="checkbox" checked={master.limiter ?? false} onChange={(e) => manual({ limiter: e.target.checked })} />
          {t('radio.master.limiter')}
        </label>
        <label className="adm-check">
          <input type="checkbox" checked={master.lowcut ?? false} onChange={(e) => manual({ lowcut: e.target.checked })} />
          {t('radio.master.lowcut')}
        </label>
      </div>

      {/* авто-мастеринг под LUFS: честный замер BS.1770 + поправка на трек */}
      <div className="radm-lufs">
        {slider(t('radio.master.lufs'), targetLufs, -18, -9, 0.5, retarget, ' LUFS')}
        <button className="btn dark" onClick={() => void levelAll()} disabled={!!leveling}>
          {leveling ? t('radio.master.leveling', { p: leveling }) : t('radio.master.level')}
        </button>
        {levelDone && <span className="tech-label">{levelDone}</span>}
        <span className="tech-label radm-lufs-count">
          {t('radio.master.measured', { n: Object.keys(trackLufs).length })}
        </span>
      </div>
      <p className="radm-master-note">{t('radio.master.note')}</p>
    </div>
  );
}

/* ================= сама вкладка ================= */

export function RadioTab() {
  const { t } = useI18n();
  const onAir = useRadio((s) => s.onAir);
  const first = useRadio((s) => s.first);
  const setOnAir = useRadio((s) => s.setOnAir);
  const setFirst = useRadio((s) => s.setFirst);
  const trims = useRadio((s) => s.trims);
  const trackLufs = useRadio((s) => s.trackLufs);

  const [tick, setTick] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tracks = useMemo(() => allTracks(), [tick]);
  useEffect(() => onMediaChanged(() => setTick((n) => n + 1)), []);

  const [durations, setDurations] = useState<Record<string, number>>({});
  const [published, setPublished] = useState<Set<string>>(new Set());
  const [sel, setSel] = useState<RadioTrack | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'warn' | 'err'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // длительности — пробуем метаданные каждого трека
  useEffect(() => {
    let dead = false;
    for (const tr of tracks) {
      if (durations[tr.id] !== undefined) continue;
      const a = new Audio();
      a.preload = 'metadata';
      a.src = tr.url;
      a.onloadedmetadata = () => {
        if (!dead) setDurations((d) => ({ ...d, [tr.id]: a.duration }));
      };
    }
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks]);

  // что уже опубликовано на прод (/api/track); в dev очереди нет — молчим
  useEffect(() => {
    fetch('/api/track')
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        if (Array.isArray(list)) setPublished(new Set(list.map(String)));
      })
      .catch(() => {});
  }, []);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const name = file.name.replace(/[^\w.\-]+/g, '_');
    setBusy(true);
    setMsg(null);
    try {
      // 1) локально: IndexedDB → трек сразу доступен радио (blob URL) и в эфире
      await setOverride(AUDIO_PREFIX + name, 'audio', file, { prompt: name, provider: 'upload' });
      setOnAir(name, true);
      // 2) на прод: только если пролезает в лимит функции
      if (file.size > MAX_PUBLISH) {
        setMsg({ kind: 'warn', text: t('radio.upload.tooBig', { name, mb: (file.size / 1048576).toFixed(1) }) });
      } else {
        const dataBase64 = await fileToBase64(file);
        const res = await fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, dataBase64 }),
        });
        if (!res.ok) throw new Error(String(res.status));
        await postQueue(`/media/music/${name}`, 'add-track', `добавить трек ${name}: файл лежит в /api/track?name=${name}, положить в public/media/music и прописать в src/data/playlist.ts`).catch(() => {});
        setPublished((s) => new Set(s).add(name));
        setMsg({ kind: 'ok', text: t('radio.upload.ok', { name }) });
      }
    } catch {
      setMsg({ kind: 'err', text: t('radio.upload.err') });
    }
    setBusy(false);
  };

  const onAirCount = tracks.filter((tr) => isOnAir(onAir, tr.id)).length;
  const firstId = first ?? 'boost-b.mp3';

  return (
    <div className="adm-section">
      {sel && <TrackPlayer track={sel} onClose={() => setSel(null)} />}

      <div className="panel rivets">
        <div className="adm-block-title">
          <span className="tape dark">{t('radio.title')}</span>
          <span className="tech-label">{t('radio.stats', { total: tracks.length, on: onAirCount })}</span>
          <div className="radm-upload">
            <input ref={fileRef} type="file" accept=".mp3,audio/mpeg" style={{ display: 'none' }} onChange={onFile} />
            <button className="adm-mini-btn" onClick={() => fileRef.current?.click()} disabled={busy} data-testid="radio-upload">
              {busy ? t('radio.upload.busy') : t('radio.upload')}
            </button>
          </div>
        </div>
        <p className="adm-note">{t('radio.note')}</p>
        {msg && <div className={`radm-msg ${msg.kind}`}>{msg.text}</div>}

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th />
                <th>{t('radio.col.track')}</th>
                <th>{t('radio.col.dur')}</th>
                <th>{t('radio.col.status')}</th>
                <th>{t('radio.col.onair')}</th>
                <th>{t('radio.col.first')}</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((tr) => {
                const live = isOnAir(onAir, tr.id);
                const isSel = sel?.id === tr.id;
                return (
                  <tr key={tr.id}>
                    <td>
                      <button
                        className={`radm-play-btn${isSel ? ' on' : ''}`}
                        onClick={() => setSel(isSel ? null : tr)}
                        title={t('radio.listen')}
                        aria-label={t('radio.listen')}
                      >
                        ⏵
                      </button>
                    </td>
                    <td>
                      <div className="radm-row-title">
                        <span>{tr.title}</span>
                        <span className="radm-file mono">{tr.id}</span>
                      </div>
                    </td>
                    <td className="adm-num">{fmtDur(durations[tr.id])}</td>
                    <td>
                      <div className="radm-badges">
                        <span className={`adm-badge${live ? ' hit' : ' dim'}`}>
                          {live ? t('radio.live') : t('radio.off')}
                        </span>
                        {tr.uploaded ? (
                          <span className={`adm-badge${published.has(tr.id) ? '' : ' dim'}`}>
                            {published.has(tr.id) ? t('radio.status.prod') : t('radio.status.local')}
                          </span>
                        ) : (
                          <span className="adm-badge dim">{t('radio.status.seed')}</span>
                        )}
                        {/* маркеры цеха: отмастерен (LUFS замерен и выровнен) / изменён (обрезка) */}
                        {trackLufs[tr.id] !== undefined && (
                          <span className="adm-badge hit" title={`${trackLufs[tr.id].toFixed(1)} LUFS`}>
                            {t('radio.mark.mastered')}
                          </span>
                        )}
                        {trims[tr.id] && (
                          <span className="adm-badge" title={`${trims[tr.id].start}s–${trims[tr.id].end}s`}>
                            ✂ {t('radio.mark.edited')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <label className="adm-check">
                        <input type="checkbox" checked={live} onChange={(e) => setOnAir(tr.id, e.target.checked)} />
                        {t('radio.col.onair')}
                      </label>
                    </td>
                    <td>
                      <button
                        className="adm-mini-btn"
                        style={firstId === tr.id ? { background: 'var(--blood)', borderColor: 'var(--blood)', color: '#fff' } : undefined}
                        onClick={() => setFirst(tr.id)}
                        disabled={firstId === tr.id}
                      >
                        {firstId === tr.id ? t('radio.first.on') : t('radio.first')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <MasterPanel />
    </div>
  );
}
