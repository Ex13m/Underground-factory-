/**
 * Вкладка ЭФИР: курирование hero-роликов (TV_CLIPS).
 * Наведение — живой превью; чекбокс «В эфире» исключает ролик из заставки
 * главной и Видеосалона; «БРАК» снимает с эфира и шлёт заявку на удаление
 * в серверную очередь /api/queue (формат — как у заявок Higgsfield,
 * kind: 'scrap-video'). Ошибка сети не роняет — пометка остаётся локально.
 */

import { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { TV_CLIPS } from '../../data/tv';
import { useOnAir } from '../../store/onair';

type SendState = 'sending' | 'ok' | 'err';

export function OnAirTab() {
  const { t } = useI18n();
  const { off, scrap, toggle, markScrap, unmarkScrap, resetAll } = useOnAir();
  const [sent, setSent] = useState<Record<string, SendState>>({});

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
                />
                <div className="adm-onair-name mono" title={src}>{name}</div>
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
    </div>
  );
}
