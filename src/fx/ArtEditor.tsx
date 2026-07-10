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
import { useCarGallery } from '../store/cargallery';
import {
  readGenKeys, writeGenKeys, PROVIDER_MODELS, DEFAULT_PROVIDER,
  finalPrompt, type GenProvider,
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
// реальные уличные локации (НЕ один и тот же гараж): ультрареализм — главное,
// стилизация под сайт — только лёгкой палитрой (см. STYLE_SUFFIX)
const CAR_SCENES = [
  'parked on a real city street at golden hour, everyday surroundings',
  'street-parked on wet asphalt after rain, overcast daylight',
  'rolling shot on a highway at dusk, natural motion blur',
  'parked by a roadside diner in the evening, practical lights',
  'quiet residential street at night, sodium street lamps',
  'industrial district street by day, honest documentary look',
  'mountain road pull-off at sunrise, soft haze',
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
      return `Ultra realistic professional automotive photo, pro camera: ${c.make} ${c.model} (${c.years}), tastefully tuned custom version with aftermarket body kit, ${scene}, true-to-life paint and reflections, no text`;
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

/** Другие фото ТОГО ЖЕ объекта: остальные медиа обвеса; для тачки — ЕЁ ЖЕ
    главное фото и её галерея (фото ДРУГИХ тачек в референсы не идут:
    консистентность — закон, чужой кузов ломает генерацию). */
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
  const cm = key.match(/^car-(?!draft-|live-)(.+)$/);
  if (cm) {
    const c = api.listCars().find((x) => x.id === cm[1]);
    const main = getOverride(key)?.url ?? c?.img;
    if (main) out.push({ url: main, label: `${c?.make ?? ''} ${c?.model ?? ''}`.trim() || cm[1] });
    for (const [i, p] of (useCarGallery.getState().photos[cm[1]] ?? []).entries()) {
      out.push({ url: p.url, label: `#${i + 1}` });
    }
  }
  return out;
}

/** имя тачки по ключу медиа: сид/кастомная — из каталога, черновик — из ключа формы */
function carNameOf(key: string): string | undefined {
  const cm = key.match(/^car(?:-live)?-(?!draft-)(.+)$/);
  if (cm) {
    const c = api.listCars().find((x) => x.id === cm[1]);
    if (c) return `${c.make} ${c.model} (${c.years})`;
  }
  const dm = key.match(/^car-draft-(.+)$/);
  if (dm) {
    const name = dm[1].replace(/[-_]+/g, ' ').trim();
    if (name && name !== '') return name;
  }
  return undefined;
}

export function ArtEditor() {
  const { t } = useI18n();
  const artEdit = useUI((s) => s.artEdit);
  const [target, setTarget] = useState<ArtTarget | null>(null);
  const [refs, setRefs] = useState<RefCand[]>([]);
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<GenProvider>(() => {
    const p = readGenKeys().provider;
    // бесплатного больше нет: сохранённый pollinations переводим на дефолт
    return p && PROVIDER_MODELS.some((m) => m.id === p) ? p : DEFAULT_PROVIDER;
  });
  /** единый ключ Replicate (r8_…) для NANO BANANA и GPT IMAGE; живёт в localStorage */
  const [keyDraft, setKeyDraft] = useState(() => readGenKeys().replicate ?? '');
  const [keyStatus, setKeyStatus] = useState<'idle' | 'testing' | 'ok' | 'bad'>('idle');

  /** живая проверка: наша функция /api/generate?ping дергает Replicate этим ключом */
  const testKey = async () => {
    if (!keyDraft.trim() || keyStatus === 'testing') return;
    setKeyStatus('testing');
    try {
      const res = await fetch('/api/generate?ping=1', {
        headers: { 'x-replicate-key': keyDraft.trim() },
      });
      setKeyStatus(res.ok ? 'ok' : 'bad');
    } catch {
      setKeyStatus('bad');
    }
  };
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
    closeMulti();
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

  /** одна генерация конкретной моделью: все провайдеры ходят через нашу
      функцию /api/generate (Replicate), ключ — из поля на сайте (заголовком)
      или из Netlify env. Ошибка — throw с текстом. */
  async function genOne(p: GenProvider, fp: string, references: string[]): Promise<{ blob: Blob | null; url: string }> {
    const tgt = target!;
    const rKey = readGenKeys().replicate?.trim();
    const model = PROVIDER_MODELS.find((m) => m.id === p)?.model ?? 'nano';
    const r = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(rKey ? { 'x-replicate-key': rKey } : {}),
      },
      body: JSON.stringify({
        prompt: fp, width: tgt.width, height: tgt.height, model,
        ...(references.length ? { references } : {}),
      }),
    });
    if (r.ok && (r.headers.get('content-type') ?? '').startsWith('image/')) {
      const blob = await r.blob();
      return { blob, url: URL.createObjectURL(blob) };
    }
    const data = await r.json().catch(() => ({} as { error?: string }));
    throw new Error(data?.error === 'NO_SERVER_KEY' ? t('art.err.norepl') : String(data?.error ?? `HTTP ${r.status}`));
  }

  /** арт-агент промптов: для тачки строит детальный промпт на сервере
      (точное поколение и кузов дословно → консистентность; мой промпт — закон,
      стилизация — только палитрой). Для не-тачек и при сбое — локальная сборка. */
  async function buildPrompt(): Promise<string> {
    const tgt = target!;
    const userPrompt = prompt.trim();
    const car = carNameOf(tgt.key);
    if (car) {
      const rKey = readGenKeys().replicate?.trim();
      try {
        const r = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(rKey ? { 'x-replicate-key': rKey } : {}),
          },
          body: JSON.stringify({ carPrompt: { car, userPrompt, style: useStyle } }),
        });
        const d = await r.json().catch(() => ({} as { prompt?: string }));
        if (r.ok && d?.prompt) return String(d.prompt);
      } catch { /* агент недоступен — соберём промпт локально ниже */ }
    }
    return finalPrompt(userPrompt || autoPrompt(tgt.key), useStyle);
  }

  async function generate() {
    if (!target || busy) return;
    setError('');
    setApplied(false);
    setBusy(true);
    try {
      // тачка → детальный промпт от арт-агента; референсы — фото ЭТОЙ тачки
      const fp = await buildPrompt();
      const references = await collectRefs();
      const res = await genOne(provider, fp, references);
      clearPreview();
      setPreview(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(false);
  }

  // ---- «во всех моделях сразу»: один промпт → все шесть параллельно ----
  interface MultiItem {
    id: GenProvider;
    label: string;
    status: 'busy' | 'ok' | 'err';
    blob?: Blob | null;
    url?: string;
  }
  const [multi, setMulti] = useState<MultiItem[] | null>(null);
  const closeMulti = () => {
    setMulti((m) => {
      m?.forEach((x) => { if (x.blob && x.url) URL.revokeObjectURL(x.url); });
      return null;
    });
  };

  async function generateAll() {
    if (!target || busy) return;
    setError('');
    setApplied(false);
    setBusy(true);
    closeMulti();
    // один детальный промпт (агент) и одни референсы — на все модели сразу
    const fp = await buildPrompt();
    const references = await collectRefs();
    setMulti(PROVIDER_MODELS.map((m) => ({ id: m.id, label: m.label, status: 'busy' as const })));
    await Promise.all(
      PROVIDER_MODELS.map(async (m) => {
        try {
          const res = await genOne(m.id, fp, references);
          setMulti((s) => s?.map((x) => (x.id === m.id ? { ...x, status: 'ok' as const, ...res } : x)) ?? s);
        } catch {
          setMulti((s) => s?.map((x) => (x.id === m.id ? { ...x, status: 'err' as const } : x)) ?? s);
        }
      }),
    );
    setBusy(false);
  }

  /** выбранный из сетки результат — в предпросмотр (дальше обычное «Применить») */
  const pickMulti = (it: MultiItem) => {
    if (it.status !== 'ok' || !it.url) return;
    pickProvider(it.id); // метаданные и подпись — от реально выбранной модели
    clearPreview();
    // свой object URL: сетка живёт отдельно, её URL не трогаем
    setPreview({ blob: it.blob ?? null, url: it.blob ? URL.createObjectURL(it.blob) : it.url });
  };

  async function apply() {
    if (!target || !preview) return;
    if (preview.blob) {
      await setOverride(target.key, 'image', preview.blob, { prompt: prompt.trim(), provider });
    } else {
      // URL-режим: сохраняем саму ссылку — легко, автономно, переживает перезагрузку
      setUrlOverride(target.key, preview.url, prompt.trim());
    }
    // фото тачки — в галерею её карточки (листалка в CarModal, галочки в админке)
    const carMatch = target.key.match(/^car-(?!draft-|live-)(.+)$/);
    if (carMatch) {
      try {
        const url = preview.blob ? await blobToDataUrl(preview.blob) : preview.url;
        useCarGallery.getState().addPhoto(carMatch[1], url);
      } catch { /* галерея — бонус, не роняем применение */ }
    }
    clearPreview();
    setApplied(true);
  }

  /** одобренную картинку — в референсы: следующие генерации держат тот же образ */
  async function previewToRefs() {
    if (!preview) return;
    try {
      const url = preview.blob ? await blobToDataUrl(preview.blob) : preview.url;
      setRefs((rs) =>
        rs.some((r) => r.url === url) ? rs : [...rs, { url, label: t('art.ref.approved'), on: true }],
      );
    } catch { /* не вышло сжать — просто не добавляем */ }
  }

  /** выбранные галочками референсы → компактные data-URI (сервер берёт до 3) */
  async function collectRefs(): Promise<string[]> {
    const picked = refs.filter((r) => r.on).slice(0, 3);
    const out: string[] = [];
    for (const r of picked) {
      try {
        if (r.url.startsWith('data:')) { out.push(r.url); continue; }
        const res = await fetch(r.url);
        if (!res.ok) continue;
        out.push(await blobToDataUrl(await res.blob()));
      } catch { /* недоступный референс просто пропускаем */ }
    }
    return out;
  }

  /** blob → компактный dataURL (jpeg ≤1280px) для галереи тачки */
  async function blobToDataUrl(blob: Blob): Promise<string> {
    const url = URL.createObjectURL(blob);
    try {
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = url;
      });
      const k = Math.min(1, 1280 / Math.max(img.width, img.height));
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.width * k);
      cv.height = Math.round(img.height * k);
      cv.getContext('2d')!.drawImage(img, 0, 0, cv.width, cv.height);
      return cv.toDataURL('image/jpeg', 0.82);
    } finally {
      URL.revokeObjectURL(url);
    }
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
            {/* все модели — через Replicate (один ключ r8_); БЕСПЛАТНО — flux-schnell */}
            {PROVIDER_MODELS.map((m) => (
              <button
                key={m.id}
                className={`btn sm ${provider === m.id ? '' : 'ghost'}`}
                onClick={() => pickProvider(m.id)}
                title="Replicate"
              >
                {m.label}
              </button>
            ))}
            {/* один промпт — все шесть моделей параллельно */}
            <button
              className="btn sm dark"
              onClick={generateAll}
              disabled={busy}
              title={t('art.all.hint')}
              data-testid="artedit-all"
            >
              ⚡ {t('art.all')}
            </button>
          </div>

          {multi && (
            <div className="artedit-multi">
              <div className="tech-label artedit-multi-head">
                {t('art.all.pick')}
                <button className="artedit-x" onClick={closeMulti} aria-label={t('common.cancel')}>✕</button>
              </div>
              <div className="artedit-multi-grid">
                {multi.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`artedit-multi-cell ${m.status}`}
                    onClick={() => pickMulti(m)}
                    disabled={m.status !== 'ok'}
                    title={m.label}
                  >
                    {m.status === 'ok' && m.url ? (
                      <img
                        src={m.url}
                        alt=""
                        onError={() =>
                          setMulti((s) => s?.map((x) => (x.id === m.id ? { ...x, status: 'err' as const } : x)) ?? s)
                        }
                      />
                    ) : (
                      <span className="artedit-multi-state">{m.status === 'busy' ? '…' : '✕'}</span>
                    )}
                    <i>{m.label}</i>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* единый ключ Replicate для всех моделей: хранится ТОЛЬКО в этом
              браузере, уходит заголовком в нашу же функцию /api/generate */}
          {(
            <div className="artedit-keyrow">
              <input
                className="field"
                type="password"
                autoComplete="off"
                value={keyDraft}
                placeholder={t('art.key.ph')}
                onChange={(e) => {
                  setKeyDraft(e.target.value);
                  setKeyStatus('idle');
                  writeGenKeys({ replicate: e.target.value.trim() });
                }}
              />
              <button
                type="button"
                className="btn sm ghost"
                onClick={() => void testKey()}
                disabled={!keyDraft.trim() || keyStatus === 'testing'}
              >
                {keyStatus === 'testing' ? t('art.key.testing') : t('art.key.test')}
              </button>
              <span
                className="tech-label"
                style={keyStatus === 'ok' ? { color: '#46c85a' } : keyStatus === 'bad' ? { color: 'var(--blood)' } : undefined}
              >
                {keyStatus === 'ok'
                  ? t('art.key.ok')
                  : keyStatus === 'bad'
                    ? t('art.key.bad')
                    : keyDraft.trim()
                      ? t('art.key.saved')
                      : t('art.key.note')}
              </span>
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
            {preview && (
              // одобренный кадр → в референсы: дальше держим тот же образ
              <button className="btn sm ghost" onClick={() => void previewToRefs()} title={t('art.toRefs.hint')}>
                {t('art.toRefs')}
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
              {/* URL-режим (бесплатный генератор): падение загрузки — видимая ошибка,
                  а не вечная пустота */}
              <img
                src={preview.url}
                alt=""
                onError={() => {
                  clearPreview();
                  setError(t('art.err.genload'));
                }}
              />
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
