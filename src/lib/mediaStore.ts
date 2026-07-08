/**
 * MediaStore — оверрайды картинок/видео арт-редактора + 3D-модели (STL).
 * Блобы живут в IndexedDB (localStorage мал для изображений), в памяти — кэш
 * objectURL для синхронного рендера. Ключ оверрайда = seed медиа-объекта:
 * он уникален на объект и одинаков для одной картинки во всех местах сайта.
 * STL-модели деталей хранятся с kind='model' по ключу `${productId}-stl` —
 * задел под точную генерацию по геометрии.
 */

const DB_NAME = 'uf-media';
const STORE = 'overrides';
const EVT = 'uf:media-changed';

export type MediaKind = 'image' | 'video' | 'model';

export interface MediaOverride {
  key: string;
  kind: MediaKind;
  blob: Blob;
  /** промпт, которым сгенерирована картинка (для видео — имя файла) */
  prompt?: string;
  provider?: string;
  updatedAt: number;
}

interface CacheEntry {
  url: string;
  kind: MediaKind;
  prompt?: string;
  provider?: string;
  updatedAt: number;
}

const cache = new Map<string, CacheEntry>();
let ready = false;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'key' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest): Promise<unknown> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = run(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
      }),
  );
}

function emit() {
  window.dispatchEvent(new CustomEvent(EVT));
}

function toEntry(o: MediaOverride): CacheEntry {
  return {
    url: URL.createObjectURL(o.blob),
    kind: o.kind,
    prompt: o.prompt,
    provider: o.provider,
    updatedAt: o.updatedAt,
  };
}

/** Загрузить все оверрайды в кэш (вызывается один раз при старте). */
export async function initMediaStore(): Promise<void> {
  if (ready) return;
  try {
    const all = (await tx('readonly', (s) => s.getAll())) as MediaOverride[];
    for (const o of all) cache.set(o.key, toEntry(o));
  } catch {
    // IndexedDB недоступен (приватный режим и т.п.) — работаем без оверрайдов
  }
  ready = true;
  emit();
}

export function getOverride(key: string): CacheEntry | undefined {
  return cache.get(key);
}

export function listOverrides(): Array<{ key: string } & CacheEntry> {
  return [...cache.entries()]
    .map(([key, e]) => ({ key, ...e }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function setOverride(
  key: string,
  kind: MediaKind,
  blob: Blob,
  meta: { prompt?: string; provider?: string } = {},
): Promise<void> {
  const record: MediaOverride = { key, kind, blob, updatedAt: Date.now(), ...meta };
  await tx('readwrite', (s) => s.put(record));
  const old = cache.get(key);
  if (old) URL.revokeObjectURL(old.url);
  cache.set(key, toEntry(record));
  emit();
}

/** Перенос оверрайда на новый ключ — черновик формы → сохранённый объект. */
export async function moveOverride(from: string, to: string): Promise<void> {
  if (from === to || !cache.has(from)) return;
  const record = (await tx('readonly', (s) => s.get(from))) as MediaOverride | undefined;
  if (!record) return;
  await tx('readwrite', (s) => s.put({ ...record, key: to }));
  await tx('readwrite', (s) => s.delete(from));
  const old = cache.get(to);
  if (old) URL.revokeObjectURL(old.url);
  cache.set(to, cache.get(from)!);
  cache.delete(from);
  emit();
}

export async function removeOverride(key: string): Promise<void> {
  await tx('readwrite', (s) => s.delete(key));
  const old = cache.get(key);
  if (old) URL.revokeObjectURL(old.url);
  cache.delete(key);
  emit();
}

export async function clearOverrides(): Promise<void> {
  await tx('readwrite', (s) => s.clear());
  for (const e of cache.values()) URL.revokeObjectURL(e.url);
  cache.clear();
  emit();
}

export function onMediaChanged(fn: () => void): () => void {
  window.addEventListener(EVT, fn);
  return () => window.removeEventListener(EVT, fn);
}
