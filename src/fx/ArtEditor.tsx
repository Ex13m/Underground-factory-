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
import { PromptBoost } from './PromptBoost';
import {
  readGenKeys, writeGenKeys, PROVIDER_MODELS, DEFAULT_PROVIDER,
  finalPrompt, blobToBudgetDataUrl, type GenProvider,
} from '../lib/imagegen';
import {
  getOverride, setOverride, setUrlOverride, type MediaKind,
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

// банк ракурсов: чтобы тачки не выходили одной и той же изометрией
const CAR_VIEWS = [
  'low front three-quarter with a wide lens',
  'rear three-quarter from low, taillights prominent',
  'dead-on front view at bumper height',
  'true side profile with a panning-shot feel',
  'high angle looking slightly down over the roofline',
  'close over the front fender, looking down the body line',
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
      const view = CAR_VIEWS[Math.floor(Math.random() * CAR_VIEWS.length)];
      return `Ultra realistic professional automotive photo, pro camera: ${c.make} ${c.model} (${c.years}), tastefully tuned custom version with aftermarket body kit, ${scene}, camera angle: ${view} (not the default isometric three-quarter), true-to-life paint and reflections, no text`;
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
  // ---- БИБЛИОТЕКА тачки: постоянный склад генераций объекта ----
  // carId цели (car-<id> / car-live-<id>, черновики не в счёт)
  const carId = target?.key.match(/^car(?:-live)?-(?!draft-)(.+)$/)?.[1];
  const allLibs = useCarGallery((s) => s.photos);
  const carLib = carId ? allLibs[carId] ?? [] : [];
  const setPhoto = useCarGallery((s) => s.setPhoto);
  const removePhoto = useCarGallery((s) => s.removePhoto);
  const mainUrl = carId
    ? getOverride(`car-${carId}`)?.url ?? api.listCars().find((c) => c.id === carId)?.img
    : undefined;

  // главное фото — обычный житель библиотеки (те же две галочки и крестик):
  // при открытии тачки заносим его на склад (dataURL) с зелёной галочкой
  useEffect(() => {
    if (!carId || !mainUrl) return;
    if (carLib.some((p) => p.url === mainUrl)) return;
    (async () => {
      try {
        const url = mainUrl.startsWith('data:')
          ? mainUrl
          : await blobToDataUrl(await (await fetch(mainUrl)).blob());
        useCarGallery.getState().addPhoto(carId, url, { ref: true });
      } catch { /* фото недоступно (CORS/сеть) — библиотека живёт без него */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carId, mainUrl]);

  /** каждая удачная генерация/загрузка тачки остаётся на складе (dataURL ≤1280) */
  async function saveToLib(res: { blob: Blob | null; url: string }, patch?: { on?: boolean; ref?: boolean }) {
    if (!carId) return;
    try {
      const url = res.blob ? await blobToDataUrl(res.blob) : res.url;
      useCarGallery.getState().addPhoto(carId, url, patch);
    } catch { /* склад — бонус, генерацию не роняем */ }
  }
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
    // окно результатов само не очищается — только при смене ОБЪЕКТА
    // (результаты чужого объекта в новую библиотеку уходить не должны)
    setTarget((prev) => {
      if (prev && prev.key !== next.key) clearResults();
      return next;
    });
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

  /** одна генерация конкретной моделью — АСИНХРОННО: создаём job на сервере
      и поллим статус (долгие модели вроде gpt-image-2 high не влезали в
      таймаут функции — от этого «глючил» GPT). Ошибка — throw с текстом. */
  async function genOne(p: GenProvider, fp: string, references: string[]): Promise<{ blob: Blob | null; url: string }> {
    const tgt = target!;
    const rKey = readGenKeys().replicate?.trim();
    const keyHeader: Record<string, string> = rKey ? { 'x-replicate-key': rKey } : {};
    const model = PROVIDER_MODELS.find((m) => m.id === p)?.model ?? 'nano';
    const start = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...keyHeader },
      body: JSON.stringify({
        prompt: fp, width: tgt.width, height: tgt.height, model, async: 1,
        ...(references.length ? { references } : {}),
      }),
    });
    const sd = await start.json().catch(() => ({} as { job?: string; error?: string }));
    if (!start.ok || !sd?.job) {
      throw new Error(sd?.error === 'NO_SERVER_KEY' ? t('art.err.norepl') : String(sd?.error ?? `HTTP ${start.status}`));
    }
    // поллинг до готовности (до ~4 минут)
    for (let i = 0; i < 80; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const st = await fetch(`/api/generate?job=${sd.job}`, { headers: keyHeader });
      const sj = await st.json().catch(() => ({} as { status?: string; error?: string }));
      if (sj?.status === 'succeeded') {
        const f = await fetch(`/api/generate?job=${sd.job}&fetch=1`, { headers: keyHeader });
        if (!f.ok) throw new Error(`result ${f.status}`);
        const blob = await f.blob();
        return { blob, url: URL.createObjectURL(blob) };
      }
      if (sj?.status === 'failed' || sj?.status === 'canceled') {
        throw new Error(String(sj?.error ?? 'генерация не удалась'));
      }
    }
    throw new Error('таймаут генерации');
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

  // какая кнопка сейчас «в работе» (мерцает): id модели или 'all'
  const [running, setRunning] = useState<GenProvider | 'all' | null>(null);

  /** клик по кнопке нейросети = запуск генерации этой моделью
      (отдельной кнопки «Генерировать» больше нет — заказ владельца) */
  async function runModel(p: GenProvider) {
    if (!target || busy) return;
    pickProvider(p);
    setError('');
    setApplied(false);
    setBusy(true);
    setRunning(p);
    try {
      // тачка → детальный промпт от арт-агента; референсы — фото ЭТОЙ тачки
      const fp = await buildPrompt();
      const references = await collectRefs();
      const res = await genOne(p, fp, references);
      clearPreview();
      setPreview(res);
      // результат — в копилку окна результатов (одобрение галочкой → склад)
      addResult(PROVIDER_MODELS.find((m) => m.id === p)?.label ?? p, res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setRunning(null);
    setBusy(false);
  }

  // ---- окно РЕЗУЛЬТАТОВ: копит ВСЕ генерации до ручной очистки ----
  // ✓ — одобрить (уходит на склад/в референсы объекта), ✕ — отклонить (удалить)
  interface GenResult { rid: number; label: string; blob: Blob | null; url: string }
  const ridRef = useRef(0);
  const [results, setResults] = useState<GenResult[]>([]);
  const [pendingLabels, setPendingLabels] = useState<string[]>([]);
  const addResult = (label: string, res: { blob: Blob | null; url: string }) =>
    setResults((rs) => [...rs, { rid: ++ridRef.current, label, ...res }]);
  const dropResult = (rid: number) =>
    setResults((rs) => {
      const it = rs.find((r) => r.rid === rid);
      if (it?.blob) URL.revokeObjectURL(it.url);
      return rs.filter((r) => r.rid !== rid);
    });
  const clearResults = () => {
    setResults((rs) => {
      rs.forEach((r) => { if (r.blob) URL.revokeObjectURL(r.url); });
      return [];
    });
  };
  /** ✓ одобрить: тачке — на склад библиотеки, прочим — в референсы */
  const approveResult = async (r: GenResult) => {
    if (carId) {
      await saveToLib(r, {});
    } else {
      try {
        const url = r.blob ? await blobToDataUrl(r.blob) : r.url;
        setRefs((rs) =>
          rs.some((x) => x.url === url) ? rs : [...rs, { url, label: t('art.ref.approved'), on: true }],
        );
      } catch { /* не сжалось — пропускаем */ }
    }
    dropResult(r.rid);
  };
  /** клик по результату — в предпросмотр (дальше обычное «Применить») */
  const pickResult = (r: GenResult) => {
    clearPreview();
    setPreview({ blob: r.blob, url: r.blob ? URL.createObjectURL(r.blob) : r.url });
  };

  async function generateAll() {
    if (!target || busy) return;
    setError('');
    setApplied(false);
    setBusy(true);
    setRunning('all');
    // один детальный промпт (агент) и одни референсы — на все модели сразу
    const fp = await buildPrompt();
    const references = await collectRefs();
    setPendingLabels(PROVIDER_MODELS.map((m) => m.label));
    const errs: string[] = [];
    await Promise.all(
      PROVIDER_MODELS.map(async (m) => {
        try {
          const res = await genOne(m.id, fp, references);
          addResult(m.label, res);
        } catch (e) {
          errs.push(`${m.label}: ${e instanceof Error ? e.message : e}`);
        } finally {
          setPendingLabels((s) => s.filter((l) => l !== m.label));
        }
      }),
    );
    if (errs.length) setError(errs.join(' · '));
    setRunning(null);
    setBusy(false);
  }

  async function apply() {
    if (!target || !preview) return;
    if (preview.blob) {
      await setOverride(target.key, 'image', preview.blob, { prompt: prompt.trim(), provider });
    } else {
      // URL-режим: сохраняем саму ссылку — легко, автономно, переживает перезагрузку
      setUrlOverride(target.key, preview.url, prompt.trim());
    }
    // применённое фото остаётся на складе БЕЗ галочки «в альбоме»: главным
    // слайдом карточки оно и так показывается через оверрайд — иначе дубль
    await saveToLib(preview, {});
    clearPreview();
    setApplied(true);
  }

  /** одобренную картинку — в референсы: следующие генерации держат тот же образ */
  async function previewToRefs() {
    if (!preview) return;
    if (carId) {
      // тачка: кладём на склад с зелёной галочкой «референс»
      await saveToLib(preview, { ref: true });
      return;
    }
    try {
      const url = preview.blob ? await blobToDataUrl(preview.blob) : preview.url;
      setRefs((rs) =>
        rs.some((r) => r.url === url) ? rs : [...rs, { url, label: t('art.ref.approved'), on: true }],
      );
    } catch { /* не вышло сжать — просто не добавляем */ }
  }

  /** референсы генерации → компактные data-URI (сервер берёт до 3).
      Тачка: главное фото (если включено) + зелёные галочки склада;
      прочие объекты: отмеченные референсы из списка. */
  async function collectRefs(): Promise<string[]> {
    const picked: string[] = [];
    if (carId) {
      // только зелёные галочки библиотеки (главное фото — тоже её житель)
      for (const p of carLib) if (p.ref) picked.push(p.url);
    } else {
      for (const r of refs) if (r.on) picked.push(r.url);
    }
    const out: string[] = [];
    for (const u of picked.slice(0, 3)) {
      try {
        // ВСЕГДА ужимаем под лимит Replicate на data-URI (~256КБ):
        // тяжёлый референс молча отбрасывался моделью
        const res = await fetch(u);
        if (!res.ok) continue;
        out.push(await blobToBudgetDataUrl(await res.blob()));
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

  // «Вернуть исходник» из панели убран (заказ владельца): сброс замен —
  // только осознанно, из истории замен в Админке → АРТ (кнопка «Сбросить»)

  async function uploadVideo(file: File) {
    if (!target) return;
    await setOverride(target.key, 'video', file, { prompt: file.name });
    setApplied(true);
  }

  // применить готовую картинку файлом (например, сгенерированную Higgsfield в терминале)
  async function uploadImage(file: File) {
    if (!target) return;
    await setOverride(target.key, 'image', file, { prompt: file.name });
    // загрузка тачке — тоже на склад (без дубля в альбом: главный слайд покажет оверрайд)
    await saveToLib({ blob: file, url: '' }, {});
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
          <div className="prompt-boost-wrap">
            <textarea
              id="artedit-prompt"
              className="field artedit-prompt"
              rows={3}
              value={prompt}
              placeholder={t('art.prompt.ph')}
              onChange={(e) => setPrompt(e.target.value)}
              data-testid="artedit-prompt"
            />
            {/* улучшатель: агент обогащает промпт, замысел — закон */}
            <PromptBoost value={prompt} onChange={setPrompt} car={carNameOf(target.key)} style={useStyle} />
          </div>

          <div className="artedit-row artedit-provider">
            {/* клик по модели = генерация ею; кнопка мерцает до завершения */}
            {PROVIDER_MODELS.map((m) => (
              <button
                key={m.id}
                className={`btn sm ${provider === m.id ? '' : 'ghost'}${running === m.id ? ' gen-blink' : ''}`}
                onClick={() => void runModel(m.id)}
                disabled={busy && running !== m.id}
                title={t('art.run.hint')}
                data-testid={`artedit-run-${m.id}`}
              >
                {m.label}
              </button>
            ))}
            {/* один промпт — все модели параллельно */}
            <button
              className={`btn sm dark${running === 'all' ? ' gen-blink' : ''}`}
              onClick={generateAll}
              disabled={busy && running !== 'all'}
              title={t('art.all.hint')}
              data-testid="artedit-all"
            >
              ⚡ {t('art.all')}
            </button>
          </div>

          {(results.length > 0 || pendingLabels.length > 0) && (
            /* копилка результатов: живёт до ручной очистки; клик — предпросмотр,
               ✓ — одобрить (на склад объекта), ✕ — отклонить */
            <div className="artedit-multi">
              <div className="tech-label artedit-multi-head">
                {t('art.results', { n: results.length })}
                <button className="artedit-x" onClick={clearResults} title={t('art.results.clear')}>
                  {t('art.results.clear')}
                </button>
              </div>
              <div className="artedit-multi-grid">
                {results.map((r) => (
                  <div key={r.rid} className="artedit-multi-cell ok" title={r.label}>
                    <img src={r.url} alt="" onClick={() => pickResult(r)} />
                    <button
                      type="button"
                      className="artedit-res-ok"
                      title={t('art.results.approve')}
                      onClick={() => void approveResult(r)}
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      className="artedit-res-no"
                      title={t('art.results.reject')}
                      onClick={() => dropResult(r.rid)}
                    >
                      ✕
                    </button>
                    <i>{r.label}</i>
                  </div>
                ))}
                {pendingLabels.map((l) => (
                  <div key={`p-${l}`} className="artedit-multi-cell busy">
                    <span className="artedit-multi-state">…</span>
                    <i>{l}</i>
                  </div>
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

          {carId ? (
            /* БИБЛИОТЕКА тачки: постоянный склад генераций. Зелёная галочка —
               референс генерации; красная — «в альбоме» карточки; ✕ — удалить */
            <div className="artedit-refs">
              <div className="tech-label">{t('art.lib')}</div>
              <div className="artedit-refs-grid">
                {carLib.map((p, i) => (
                  <div key={`${i}-${p.url.slice(-24)}`} className={`artedit-ref ${p.ref ? 'on' : ''}`}>
                    <input
                      type="checkbox"
                      className="artedit-ref-green"
                      title={t('art.lib.ref')}
                      checked={!!p.ref}
                      onChange={(e) => setPhoto(carId, i, { ref: e.target.checked })}
                    />
                    <input
                      type="checkbox"
                      className="artedit-ref-album"
                      title={t('art.lib.album')}
                      checked={p.on}
                      onChange={(e) => setPhoto(carId, i, { on: e.target.checked })}
                    />
                    <button
                      type="button"
                      className="artedit-ref-x"
                      title={t('common.delete')}
                      onClick={() => {
                        // защита от случайного удаления: подтверждение обязательно
                        if (window.confirm(t('art.lib.delConfirm'))) removePhoto(carId, i);
                      }}
                    >
                      ✕
                    </button>
                    <img src={p.url} alt="" loading="lazy" />
                    <span>{p.on ? t('art.lib.inalbum') : t('art.lib.stock')}</span>
                  </div>
                ))}
              </div>
              <div className="artedit-hint">{t('art.lib.hint')}</div>
            </div>
          ) : refs.length > 0 && (
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
