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
// queueGen: заявки на Higgsfield-генерацию исполняет Claude в терминале (см. CLAUDE.md)
import { bus } from '../lib/bus';
import { useI18n } from '../lib/i18n';
import { useUI } from '../store/ui';
import {
  generateImage, fetchAsBlob, readGenKeys, writeGenKeys,
  pollinationsUrl, finalPrompt, type GenProvider,
} from '../lib/imagegen';
import {
  getOverride, setOverride, setUrlOverride, removeOverride, type MediaKind,
} from '../lib/mediaStore';
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

/** Случайные сцены для авто-промпта тачек. */
const CAR_SCENES = [
  'night industrial dock, wet asphalt reflections',
  'underground parking garage, blood-red neon rim light',
  'night street with japanese neon signs, light rain',
  'airfield apron at dusk, dramatic sky',
  'mountain road at night, fog in the headlights',
];

/**
 * Авто-промпт по объекту: если поле пустое, генератор сам понимает,
 * что за тачка (марка/модель/годы) или деталь, и собирает промпт
 * со случайной сценой — каждый запуск даёт новую версию.
 */
function autoPrompt(key: string): string {
  const cm = key.match(/^car(?:-live)?-(.+)$/);
  if (cm) {
    const c = api.listCars().find((x) => x.id === cm[1]);
    if (c) {
      const scene = CAR_SCENES[Math.floor(Math.random() * CAR_SCENES.length)];
      return `${c.make} ${c.model} (${c.years}), tastefully tuned custom version with aftermarket body kit, ${scene}, cinematic photo, film grain, no text`;
    }
  }
  const p = api.listProducts().find((x) => key.startsWith(x.id));
  if (p) {
    return `studio product photograph: ${p.name.en}, ${p.material.en}, floating in mid-air on a matte black background, dramatic blood-red rim lighting, high contrast premium catalog shot, no car, no text`;
  }
  // неизвестный объект (hero-ролик, декоративный арт…) — универсальный заход
  // по имени ключа, чтобы кнопки работали с пустым полем на ЛЮБОМ объекте
  return `underground tuning factory scene: ${key.replace(/[-_]+/g, ' ')}, night cyber-industrial garage, red and black palette, dramatic light, cinematic photo, film grain, no text`;
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
  const [provider, setProvider] = useState<GenProvider>(readGenKeys().provider ?? 'pollinations');
  /** черновик API-ключа выбранного провайдера (живёт в localStorage через writeGenKeys) */
  const [keyDraft, setKeyDraft] = useState('');
  useEffect(() => {
    const k = readGenKeys();
    setKeyDraft(provider === 'openai' ? k.openai ?? '' : provider === 'gemini' ? k.gemini ?? '' : '');
  }, [provider]);
  const [useStyle, setUseStyle] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // blob === null → URL-режим (Pollinations): применяется сама ссылка
  const [preview, setPreview] = useState<{ blob: Blob | null; url: string } | null>(null);
  const [applied, setApplied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  // плавающее окно: null → позиция по умолчанию (справа сверху), дальше — куда перетащили
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);

  function dragStart(e: React.PointerEvent) {
    // клики по кнопкам шапки (✕) не начинают перетаскивание — иначе
    // setPointerCapture перехватывает click и крестик «не работает»
    if ((e.target as Element).closest('button')) return;
    const r = panelRef.current?.getBoundingClientRect();
    if (!r) return;
    dragRef.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }
  function dragMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    setPos({
      x: Math.min(Math.max(e.clientX - d.dx, 4), window.innerWidth - 120),
      y: Math.min(Math.max(e.clientY - d.dy, 4), window.innerHeight - 60),
    });
  }
  function dragEnd() {
    dragRef.current = null;
  }

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
    // выключили режим — плавающее окно закрывается
    if (!artEdit) setTarget(null);
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
      if (p?.blob) URL.revokeObjectURL(p.url);
      return null;
    });
  }

  function pickProvider(p: GenProvider) {
    setProvider(p);
    writeGenKeys({ provider: p });
  }

  async function generate() {
    if (!target || busy) return;
    // пустое поле — авто-промпт по объекту (тачка/деталь/любой ключ)
    const effPrompt = prompt.trim() || autoPrompt(target.key);
    setError('');
    setApplied(false);

    // путь без ключей: (1) серверная функция сайта (Replicate, ключ на Netlify),
    // (2) если сервера нет — бесплатная картинка прямо по URL (Pollinations)
    const keys = readGenKeys();
    const keyless =
      provider === 'pollinations' ||
      (provider === 'openai' && !keys.openai) ||
      (provider === 'gemini' && !keys.gemini);
    if (keyless) {
      const fp = finalPrompt(effPrompt, useStyle);
      setBusy(true);
      try {
        const r = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: fp, width: target.width, height: target.height }),
        });
        if (r.ok && (r.headers.get('content-type') ?? '').startsWith('image/')) {
          const blob = await r.blob();
          clearPreview();
          setPreview({ blob, url: URL.createObjectURL(blob) });
          setBusy(false);
          return;
        }
      } catch {
        // функции нет (локальный dev) — падаем на бесплатный генератор
      }
      setBusy(false);
      clearPreview();
      setPreview({ blob: null, url: pollinationsUrl(fp, target.width, target.height) });
      return;
    }

    setBusy(true);
    try {
      const blobs = await Promise.all(refs.filter((r) => r.on).map((r) => fetchAsBlob(r.url)));
      const blob = await generateImage({
        provider,
        prompt: effPrompt,
        useStyle,
        references: blobs.filter((b): b is Blob => !!b),
        width: target.width,
        height: target.height,
      });
      clearPreview();
      setPreview({ blob, url: URL.createObjectURL(blob) });
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function apply() {
    if (!target || !preview) return;
    if (preview.blob) {
      await setOverride(target.key, 'image', preview.blob, { prompt: prompt.trim(), provider });
    } else {
      // URL-режим: сохраняем саму ссылку — легко, автономно, переживает перезагрузку
      setUrlOverride(target.key, preview.url, prompt.trim());
    }
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

  // применить готовую картинку файлом (например, сгенерированную Higgsfield в терминале)
  async function uploadImage(file: File) {
    if (!target) return;
    await setOverride(target.key, 'image', file, { prompt: file.name });
    setApplied(true);
  }

  // заявка на генерацию через Higgsfield — исполняется Claude в терминале
  const [queued, setQueued] = useState(false);
  function orderHiggsfield() {
    if (!target) return;
    const effPrompt = prompt.trim() || autoPrompt(target.key);
    const ticket = {
      key: target.key,
      kind: (target.kind === 'video' ? 'video' : 'image') as 'image' | 'video',
      prompt: effPrompt,
      width: Math.round(target.width),
      height: Math.round(target.height),
      createdAt: Date.now(),
    };
    // локальная очередь (видна в Админке → АРТ) …
    api.queueGen(ticket);
    // …и сразу на сервер сайта: скачивать ничего не нужно,
    // Claude забирает заявки сам (GET /api/queue)
    fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket),
    }).catch(() => { /* локальный dev без функций — очередь останется в браузере */ });
    setQueued(true);
    window.setTimeout(() => setQueued(false), 2500);
  }

  const hasOverride = target ? !!getOverride(target.key) : false;

  return (
    <>
      {artEdit && <div className="artedit-badge tape hazard">{t('art.badge')}</div>}
      {target && (
        <aside
          ref={panelRef}
          className="artedit-panel panel"
          data-testid="artedit-panel"
          // позиция задаётся инлайном: плавающее окно не зависит от каскада стилей
          style={
            pos
              ? { position: 'fixed', left: pos.x, top: pos.y, right: 'auto' }
              : { position: 'fixed', top: 80, right: 14 }
          }
        >
          <header
            className="artedit-head"
            onPointerDown={dragStart}
            onPointerMove={dragMove}
            onPointerUp={dragEnd}
            title="Перетащите за шапку"
          >
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
              className={`btn sm ${provider === 'pollinations' ? '' : 'ghost'}`}
              onClick={() => pickProvider('pollinations')}
              title={t('art.free.hint')}
            >
              {t('art.free')}
            </button>
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

          {/* ключ выбранного провайдера: хранится ТОЛЬКО в этом браузере */}
          {provider !== 'pollinations' && (
            <div className="artedit-keyrow">
              <input
                className="field"
                type="password"
                autoComplete="off"
                value={keyDraft}
                placeholder={t('art.key.ph')}
                onChange={(e) => {
                  setKeyDraft(e.target.value);
                  writeGenKeys({ [provider]: e.target.value.trim() } as Partial<import('../lib/imagegen').GenKeys>);
                }}
              />
              <span className="tech-label">{t('art.key.note')}</span>
            </div>
          )}

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
            <button
              className="btn"
              onClick={generate}
              disabled={busy || (!prompt.trim() && !autoPrompt(target.key))}
              data-testid="artedit-generate"
            >
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

          <div className="artedit-row">
            <button
              className="btn sm dark"
              onClick={orderHiggsfield}
              disabled={!prompt.trim() && !autoPrompt(target.key)}
              title={t('art.order.hint')}
              data-testid="artedit-order"
            >
              {t('art.order')}
            </button>
            <label className="btn sm ghost" style={{ cursor: 'pointer' }}>
              {t('art.upload.image')}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
              />
            </label>
          </div>

          {error && <div className="artedit-error">{error}</div>}
          {applied && <div className="artedit-ok">{t('art.applied')}</div>}
          {queued && <div className="artedit-ok">{t('art.order.done')}</div>}
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
