/**
 * Вкладка ЭФИР: курирование hero-роликов (TV_CLIPS).
 * Наведение — живой превью; клик по превью — видеоредактор (модалка):
 * покадровая перемотка, луп отрезка, виртуальная обрезка (store onair.trims,
 * её уважает VideoBg) и заявка «обрезать насовсем» (kind: 'trim-video').
 * Чекбокс «В эфире» исключает ролик из заставки главной и Видеосалона;
 * «БРАК» снимает с эфира и шлёт заявку на удаление в серверную очередь
 * /api/queue (формат — как у заявок Higgsfield, kind: 'scrap-video').
 * Ошибка сети не роняет — пометка остаётся локально.
 */

import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { TV_CLIPS } from '../../data/tv';
import { useOnAir } from '../../store/onair';

type SendState = 'sending' | 'ok' | 'err';

/** Шаг покадровой перемотки: один кадр при 24 fps. */
const FRAME = 1 / 24;
/** Шаг ползунков обрезки, сек. */
const TRIM_STEP = 0.05;

const fmt = (s: number) => s.toFixed(2);

/**
 * Видеоредактор поверх «Эфира»: большой плеер + таймлайн с двумя ползунками
 * (начало/конец отрезка), «Применить» пишет виртуальную обрезку в store,
 * «Обрезать насовсем» шлёт заявку kind:'trim-video' в /api/queue.
 * Внизу — те же контролы, что в карточке (эфир/брак).
 */
function VideoEditModal({
  src,
  scrapState,
  onClose,
  onOrderScrap,
}: {
  src: string;
  scrapState?: SendState;
  onClose: () => void;
  onOrderScrap: (src: string) => void;
}) {
  const { t } = useI18n();
  const { off, scrap, toggle, trims, setTrim, clearTrim } = useOnAir();
  const videoRef = useRef<HTMLVideoElement>(null);

  const saved = trims[src];
  const [dur, setDur] = useState(0);
  const [cur, setCur] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loopSeg, setLoopSeg] = useState(false);
  const [start, setStart] = useState(saved?.start ?? 0);
  const [end, setEnd] = useState(saved?.end ?? 0);
  const [applied, setApplied] = useState(false);
  const [trimSent, setTrimSent] = useState<SendState | null>(null);

  const isOff = off.includes(src);
  const isScrap = scrap.includes(src);
  const name = src.split('/').pop() ?? src;

  // Esc закрывает редактор
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onMeta = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    const d = v.duration || 0;
    setDur(d);
    // без сохранённой обрезки конец отрезка = вся длительность;
    // с сохранённой — клампим по факту и стартуем с начала отрезка
    if (!saved) {
      setEnd(d);
    } else {
      setEnd(Math.min(saved.end, d));
      v.currentTime = saved.start;
    }
  };

  const onTime = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    setCur(v.currentTime);
    // луп выбранного куска: дошли до конца отрезка — назад к началу
    if (loopSeg && end > start && v.currentTime >= end) v.currentTime = start;
  };

  const playToggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => { /* автоплей заблокирован — не страшно */ });
    else v.pause();
  };

  // покадрово: пауза + сдвиг на 1/24 с
  const stepFrame = (dir: 1 | -1) => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = Math.min(Math.max(v.currentTime + dir * FRAME, 0), dur || v.duration || 0);
  };

  // ползунки не пересекаются (минимум один шаг между ними); тянешь — видео показывает кадр
  const changeStart = (val: number) => {
    const nv = Math.max(0, Math.min(val, end - TRIM_STEP));
    setStart(nv);
    setApplied(false);
    if (videoRef.current) videoRef.current.currentTime = nv;
  };
  const changeEnd = (val: number) => {
    const nv = Math.min(dur || val, Math.max(val, start + TRIM_STEP));
    setEnd(nv);
    setApplied(false);
    if (videoRef.current) videoRef.current.currentTime = nv;
  };

  const apply = () => {
    setTrim(src, Number(fmt(start)), Number(fmt(end)));
    setApplied(true);
  };
  const reset = () => {
    clearTrim(src);
    setStart(0);
    setEnd(dur);
    setApplied(false);
  };

  // «Обрезать насовсем» — заявка в серверную очередь (формат как у брака,
  // kind: 'trim-video' + числовые start/end для физической перерезки файла)
  const orderTrim = () => {
    setTrimSent('sending');
    const ticket = {
      key: src,
      kind: 'trim-video',
      prompt: `trim ${fmt(start)}-${fmt(end)}`,
      start: Number(fmt(start)),
      end: Number(fmt(end)),
      width: 1920,
      height: 1080,
      createdAt: Date.now(),
    };
    fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket),
    })
      .then((r) => setTrimSent(r.ok ? 'ok' : 'err'))
      .catch(() => setTrimSent('err'));
  };

  const pct = (v: number) => (dur ? `${(v / dur) * 100}%` : '0%');

  return (
    <div className="adm-vedit-overlay" onClick={onClose} data-testid="adm-vedit">
      <div className="adm-vedit panel rivets" onClick={(e) => e.stopPropagation()}>
        <div className="adm-vedit-head">
          <span className="tape dark">{t('admin.vedit.title')}</span>
          <span className="adm-vedit-file mono" title={src}>{name}</span>
          <button className="adm-vedit-x" onClick={onClose} aria-label={t('admin.vedit.close')}>✕</button>
        </div>

        <video
          ref={videoRef}
          className="adm-vedit-video"
          src={src}
          muted
          playsInline
          autoPlay
          preload="metadata"
          onLoadedMetadata={onMeta}
          onTimeUpdate={onTime}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={(e) => {
            // луп куска работает и через естественный конец ролика
            if (loopSeg) {
              e.currentTarget.currentTime = start;
              e.currentTarget.play().catch(() => { /* ок */ });
            }
          }}
        />

        {/* транспорт: play/pause, покадрово, луп отрезка, таймкод */}
        <div className="adm-vedit-transport">
          <button className="adm-mini-btn" onClick={() => stepFrame(-1)} title={t('admin.vedit.prevFrame')}>
            |◂
          </button>
          <button className="adm-mini-btn" onClick={playToggle} title={playing ? t('admin.vedit.pause') : t('admin.vedit.play')}>
            {playing ? '❚❚' : '▶'}
          </button>
          <button className="adm-mini-btn" onClick={() => stepFrame(1)} title={t('admin.vedit.nextFrame')}>
            ▸|
          </button>
          <label className="adm-check">
            <input type="checkbox" checked={loopSeg} onChange={() => setLoopSeg((v) => !v)} />
            {t('admin.vedit.loop')}
          </label>
          <span className="adm-vedit-time mono">{fmt(cur)} / {fmt(dur)} s</span>
        </div>

        {/* таймлайн: отрезок [A;B] + позиция; два ползунка друг над другом */}
        <div className="adm-vedit-timeline">
          <div className="adm-vedit-strip" aria-hidden>
            <div className="adm-vedit-region" style={{ left: pct(start), width: pct(Math.max(end - start, 0)) }} />
            <div className="adm-vedit-playhead" style={{ left: pct(cur) }} />
          </div>
          <input
            type="range"
            className="adm-vedit-range"
            min={0}
            max={dur || 0}
            step={TRIM_STEP}
            value={start}
            onChange={(e) => changeStart(Number(e.target.value))}
            aria-label={t('admin.vedit.start')}
            disabled={!dur}
          />
          <input
            type="range"
            className="adm-vedit-range"
            min={0}
            max={dur || 0}
            step={TRIM_STEP}
            value={end}
            onChange={(e) => changeEnd(Number(e.target.value))}
            aria-label={t('admin.vedit.end')}
            disabled={!dur}
          />
        </div>
        <div className="adm-vedit-marks mono">
          <span>A ▸ {fmt(start)}s</span>
          <span>B ▸ {fmt(end)}s</span>
        </div>

        {/* виртуальная обрезка + заявка на физическую */}
        <div className="adm-vedit-actions">
          <button className="adm-mini-btn" onClick={apply} disabled={!dur}>
            {t('admin.vedit.apply')}
          </button>
          <button className="adm-mini-btn" onClick={reset} disabled={!saved && !applied}>
            {t('admin.vedit.reset')}
          </button>
          {applied && <span className="adm-vedit-info">{t('admin.vedit.applied')}</span>}
          {!applied && saved && (
            <span className="adm-vedit-info">
              {t('admin.vedit.trimInfo', { start: fmt(saved.start), end: fmt(saved.end) })}
            </span>
          )}
          <button className="adm-mini-btn danger adm-vedit-forever" onClick={orderTrim} disabled={!dur}>
            {t('admin.vedit.forever')}
          </button>
        </div>
        {trimSent && (
          <div className={`adm-onair-status${trimSent === 'err' ? ' err' : ''}`}>
            {trimSent === 'sending' && t('admin.onair.sending')}
            {trimSent === 'ok' && t('admin.onair.sentOk')}
            {trimSent === 'err' && t('admin.onair.sentErr')}
          </div>
        )}

        {/* те же контролы, что в карточке: эфир + брак */}
        <div className="adm-vedit-bottom">
          <label className="adm-check">
            <input type="checkbox" checked={!isOff} onChange={() => toggle(src)} />
            {t('admin.onair.live')}
          </label>
          <button
            className={`adm-mini-btn danger${isScrap ? ' on' : ''}`}
            onClick={() => onOrderScrap(src)}
          >
            {isScrap ? t('admin.onair.scrapOn') : t('admin.onair.scrap')}
          </button>
          {isScrap && (
            <div className={`adm-onair-status${scrapState === 'err' ? ' err' : ''}`}>
              {scrapState === 'sending' && t('admin.onair.sending')}
              {scrapState === 'ok' && t('admin.onair.sentOk')}
              {scrapState === 'err' && t('admin.onair.sentErr')}
              {!scrapState && t('admin.onair.marked')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function OnAirTab() {
  const { t } = useI18n();
  const { off, scrap, toggle, markScrap, unmarkScrap, resetAll, trims } = useOnAir();
  const [sent, setSent] = useState<Record<string, SendState>>({});
  // путь ролика, открытого в видеоредакторе (null — редактор закрыт)
  const [editing, setEditing] = useState<string | null>(null);

  const offSet = new Set(off);
  const scrapSet = new Set(scrap);
  const onAirCount = TV_CLIPS.filter((c) => !offSet.has(c)).length;

  const play = (e: React.MouseEvent<HTMLVideoElement>) => {
    e.currentTarget.play().catch(() => { /* автоплей заблокирован — не страшно */ });
  };
  const stop = (e: React.MouseEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    v.pause();
    v.currentTime = 0;
  };

  const orderScrap = (src: string) => {
    if (scrapSet.has(src)) {
      // повторное нажатие — снимаем пометку локально (очередь чистится при обработке)
      unmarkScrap(src);
      setSent((s) => {
        const next = { ...s };
        delete next[src];
        return next;
      });
      return;
    }
    markScrap(src); // локальная пометка + автоснятие с эфира
    setSent((s) => ({ ...s, [src]: 'sending' }));
    // тот же формат, что заявки Higgsfield (см. fx/ArtEditor.tsx + uf-queue.mts);
    // kind: 'scrap-video' — маркер брака для Claude при разборе очереди
    const ticket = {
      key: src,
      kind: 'scrap-video',
      prompt: 'удалить из репозитория',
      width: 1920,
      height: 1080,
      createdAt: Date.now(),
    };
    fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket),
    })
      .then((r) => setSent((s) => ({ ...s, [src]: r.ok ? 'ok' : 'err' })))
      .catch(() => setSent((s) => ({ ...s, [src]: 'err' })));
  };

  return (
    <div className="adm-section">
      <div className="panel rivets">
        <div className="adm-block-title">
          <span className="tape dark">{t('admin.onair.title')}</span>
          <span className="tech-label">
            {t('admin.onair.stats', { total: TV_CLIPS.length, on: onAirCount, scrap: scrap.length })}
          </span>
          <button
            className="adm-mini-btn"
            style={{ marginLeft: 'auto' }}
            onClick={resetAll}
            disabled={!off.length && !scrap.length}
          >
            {t('admin.onair.resetAll')}
          </button>
        </div>
        <p className="adm-note">{t('admin.onair.note')}</p>
        <p className="adm-note">{t('admin.vedit.hint')}</p>

        <div className="adm-onair-grid">
          {TV_CLIPS.map((src) => {
            const isOff = offSet.has(src);
            const isScrap = scrapSet.has(src);
            const name = src.split('/').pop() ?? src;
            const st = sent[src];
            return (
              <div
                key={src}
                className={`adm-onair-card${isOff ? ' off' : ''}${isScrap ? ' scrap' : ''}`}
              >
                <video
                  src={src}
                  muted
                  playsInline
                  loop
                  preload="metadata"
                  onMouseEnter={play}
                  onMouseLeave={stop}
                  onClick={() => setEditing(src)}
                  style={{ cursor: 'pointer' }}
                  title={t('admin.vedit.open')}
                />
                <div className="adm-onair-name mono" title={src}>
                  {name}
                  {trims[src] && <span className="adm-vedit-badge"> ✂ {trims[src].start.toFixed(2)}–{trims[src].end.toFixed(2)}</span>}
                </div>
                <div className="adm-onair-row">
                  <label className="adm-check">
                    <input type="checkbox" checked={!isOff} onChange={() => toggle(src)} />
                    {t('admin.onair.live')}
                  </label>
                  <button
                    className={`adm-mini-btn danger${isScrap ? ' on' : ''}`}
                    onClick={() => orderScrap(src)}
                  >
                    {isScrap ? t('admin.onair.scrapOn') : t('admin.onair.scrap')}
                  </button>
                </div>
                {isScrap && (
                  <div className={`adm-onair-status${st === 'err' ? ' err' : ''}`}>
                    {st === 'sending' && t('admin.onair.sending')}
                    {st === 'ok' && t('admin.onair.sentOk')}
                    {st === 'err' && t('admin.onair.sentErr')}
                    {!st && t('admin.onair.marked')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {editing && (
        <VideoEditModal
          src={editing}
          scrapState={sent[editing]}
          onClose={() => setEditing(null)}
          onOrderScrap={orderScrap}
        />
      )}
    </div>
  );
}
