/**
 * АРТ-РЕДАКТОР — админ-режим правки медиа прямо на сайте.
 * Включается в админке (вкладка АРТ): каждый Img/VideoBg подсвечивается,
 * клик открывает панель: промпт → генерация (GPT Image / Nano Banana 2) →
 * применить/ещё вариант/сбросить. Для видео — загрузка файла.
 * Также открывается из админ-форм кнопкой ГЕН (bus 'art:open').
 * Референсы: текущая картинка + другие фото того же объекта (выбор галочками).
 * Оверрайды живут в IndexedDB (см. lib/mediaStore) и переживают перезагрузку.
 */

import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { bus } from '../lib/bus';
import { useI18n } from '../lib/i18n';
import { useUI } from '../store/ui';
import {
  generateImage, fetchAsBlob, readGenKeys, writeGenKeys, type GenProvider,
} from '../lib/imagegen';
import { getOverride, setOverride, removeOverride, type MediaKind } from '../lib/mediaStore';
import '../styles/art-editor.css';

interface RefCand {
  url: string;
  label: string;
  on: boolean;
}

export interface ArtTarget {
  key: string;
  kind: MediaKind;
  /** что сейчас показано на месте объекта (для референса) */
  src?: string;
  width: number;
  height: number;
  /** готовый список референсов (из админ-форм); иначе соберём по ключу */
  refs?: Array<{ url: string; label: string }>;
}

/** Другие фото того же объекта: остальные медиа обвеса / фото других тачек. */
function siblingRefs(key: string): Array<{ url: string; label: string }> {
  const out: Array<{ url: string; label: string }> = [];
  const pm = key.match(/^(.+)-(\d+)$/);
  const product = pm ? api.getProduct(pm[1]) : undefined;
  if (product) {
    product.media.forEach((m, i) => {
      if (i === Number(pm![2]) || m.type !== 'image') return;
      const url = getOverride(m.seed ?? `${product.id}-${i}`)?.url ?? m.url;
      if (url) out.push({ url, label: `${product.sku} #${i + 1}` });
    });
  }
  const cm = key.match(/^car-(.+)$/);
  if (cm) {
    for (const c of api.listCars()) {
      const k = `car-${c.id}`;
      if (k === key) continue;
      const url = getOverride(k)?.url ?? c.img;
      if (url) out.push({ url, label: `${c.make} ${c.model}` });
    }
  }
  return out;
}

export function ArtEditor() {
  const { t } = useI18n();
  const artEdit = useUI((s) => s.artEdit);
  const [target, setTarget] = useState<ArtTarget | null>(null);
  const [refs, setRefs] = useState<RefCand[]>([]);
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<GenProvider>(readGenKeys().provider ?? 'gemini');
  const [useStyle, setUseStyle] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{ blob: Blob; url: string } | null>(null);
  const [applied, setApplied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function openTarget(next: ArtTarget) {
    const ov = getOverride(next.key);
    const cands: RefCand[] = [];
    if (next.src) cands.push({ url: next.src, label: t('art.ref.current'), on: true });
    for (const r of next.refs ?? siblingRefs(next.key)) {
      if (!cands.some((c) => c.url === r.url)) cands.push({ ...r, on: false });
    }
    setTarget(next);
    setRefs(cands);
    setPrompt(ov?.prompt && ov.kind === 'image' ? ov.prompt : '');
    clearPreview();
    setError('');
    setApplied(false);
  }

  useEffect(() => {
    document.body.classList.toggle('art-edit', artEdit);
    return () => document.body.classList.remove('art-edit');
  }, [artEdit]);

  // открытие из админ-форм (кнопка ГЕН)
  useEffect(() => bus.on('art:open', (p: ArtTarget) => openTarget(p)), []); // eslint-disable-line react-hooks/exhaustive-deps

  // перехват кликов по помеченным медиа-элементам (capture: раньше ссылок и кнопок)
  useEffect(() => {
    if (!artEdit) return;
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.('[data-uf-media]') as HTMLElement | null;
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = el.getBoundingClientRect();
      const src =
        el instanceof HTMLImageElement ? el.currentSrc || el.src
        : el instanceof HTMLVideoElement ? undefined
        : el.querySelector('img')?.src;
      openTarget({
        key: el.dataset.ufMedia!,
        kind: (el.dataset.ufKind ?? 'image') as MediaKind,
        src,
        width: rect.width || 800,
        height: rect.height || 500,
      });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [artEdit]); // eslint-disable-line react-hooks/exhaustive-deps

  function clearPreview() {
    setPreview((p) => {
      if (p) URL.revokeObjectURL(p.url);
      return null;
    });
  }

  function pickProvider(p: GenProvider) {
    setProvider(p);
    writeGenKeys({ provider: p });
  }

  async function generate() {
    if (!target || !prompt.trim() || busy) return;
    setBusy(true);
    setError('');
    setApplied(false);
    try {
      const blobs = await Promise.all(refs.filter((r) => r.on).map((r) => fetchAsBlob(r.url)));
      const blob = await generateImage({
        provider,
        prompt: prompt.trim(),
        useStyle,
        references: blobs.filter((b): b is Blob => !!b),
        width: target.width,
        height: target.height,
      });
      clearPreview();
      setPreview({ blob, url: URL.createObjectURL(blob) });
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      setError(msg.startsWith('NO_KEY') ? t('art.err.nokey') : msg);
    } finally {
      setBusy(false);
    }
  }

  async function apply() {
    if (!target || !preview) return;
    await setOverride(target.key, 'image', preview.blob, { prompt: prompt.trim(), provider });
    clearPreview();
    setApplied(true);
  }

  async function reset() {
    if (!target) return;
    await removeOverride(target.key);
    clearPreview();
    setApplied(false);
  }

  async function uploadVideo(file: File) {
    if (!target) return;
    await setOverride(target.key, 'video', file, { prompt: file.name });
    setApplied(true);
  }

  const hasOverride = target ? !!getOverride(target.key) : false;

  return (
    <>
      {artEdit && <div className="artedit-badge tape hazard">{t('art.badge')}</div>}
      {target && (
        <aside className="artedit-panel panel" data-testid="artedit-panel">
          <header className="artedit-head">
            <span className="tech-label">{t('art.title')}</span>
            <button className="artedit-x" onClick={() => setTarget(null)} aria-label={t('common.cancel')}>✕</button>
          </header>

          <div className="artedit-target tech-label">
            {t('art.target')} <b>{target.key}</b> · {target.kind === 'video' ? t('art.kind.video') : t('art.kind.image')}
            {' · '}{Math.round(target.width)}×{Math.round(target.height)} ({t('art.autosize')})
          </div>

          {target.kind === 'video' && (
            <div className="artedit-row">
              <button className="btn" onClick={() => fileRef.current?.click()} data-testid="artedit-upload">
                {t('art.upload')}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="video/mp4,video/webm"
                hidden
                onChange={(e) => e.target.files?.[0] && uploadVideo(e.target.files[0])}
              />
              <div className="artedit-hint">{t('art.upload.hint')}</div>
            </div>
          )}

          <label className="tech-label" htmlFor="artedit-prompt">
            {target.kind === 'video' ? t('art.prompt.video') : t('art.prompt')}
          </label>
          <textarea
            id="artedit-prompt"
            className="field artedit-prompt"
            rows={3}
            value={prompt}
            placeholder={t('art.prompt.ph')}
            onChange={(e) => setPrompt(e.target.value)}
            data-testid="artedit-prompt"
          />

          <div className="artedit-row artedit-provider">
            <button
              className={`btn sm ${provider === 'openai' ? '' : 'ghost'}`}
              onClick={() => pickProvider('openai')}
            >
              GPT IMAGE
            </button>
            <button
              className={`btn sm ${provider === 'gemini' ? '' : 'ghost'}`}
              onClick={() => pickProvider('gemini')}
            >
              NANO BANANA 2
            </button>
          </div>

          <label className="artedit-check">
            <input type="checkbox" checked={useStyle} onChange={(e) => setUseStyle(e.target.checked)} />
            {t('art.usestyle')}
          </label>

          {refs.length > 0 && (
            <div className="artedit-refs">
              <div className="tech-label">{t('art.refs')}</div>
              <div className="artedit-refs-grid">
                {refs.map((r, i) => (
                  <label key={r.url} className={`artedit-ref ${r.on ? 'on' : ''}`} title={r.label}>
                    <input
                      type="checkbox"
                      checked={r.on}
                      onChange={(e) =>
                        setRefs((rs) => rs.map((x, j) => (j === i ? { ...x, on: e.target.checked } : x)))
                      }
                    />
                    <img src={r.url} alt="" loading="lazy" />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="artedit-row">
            <button className="btn" onClick={generate} disabled={busy || !prompt.trim()} data-testid="artedit-generate">
              {busy ? t('art.busy') : preview ? t('art.more') : t('art.generate')}
            </button>
            {preview && (
              <button className="btn primary" onClick={apply} data-testid="artedit-apply">
                {t('art.apply')}
              </button>
            )}
            {hasOverride && (
              <button className="btn ghost" onClick={reset} data-testid="artedit-reset">
                {t('art.reset')}
              </button>
            )}
          </div>

          {error && <div className="artedit-error">{error}</div>}
          {applied && <div className="artedit-ok">{t('art.applied')}</div>}
          {preview && (
            <div className="artedit-preview">
              <img src={preview.url} alt="" />
            </div>
          )}
        </aside>
      )}
    </>
  );
}

/** Хелпер для админ-форм: открыть панель генерации для конкретного медиа. */
export function openArtEditor(target: ArtTarget) {
  bus.emit('art:open', target);
}
