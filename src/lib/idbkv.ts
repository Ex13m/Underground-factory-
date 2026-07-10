/**
 * Крошечноеключ-значение поверх IndexedDB для zustand/persist:
 * localStorage упирается в ~5МБ (библиотека фото тачек с dataURL выбивает
 * квоту, и записи молча пропадают после перезагрузки) — IndexedDB не упирается.
 * Интерфейс совместим с createJSONStorage(() => idbKV).
 */

const DB_NAME = 'uf-kv';
const STORE = 'kv';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db: IDBDatabase, mode: IDBTransactionMode) {
  return db.transaction(STORE, mode).objectStore(STORE);
}

export const idbKV = {
  async getItem(key: string): Promise<string | null> {
    try {
      const db = await openDb();
      return await new Promise<string | null>((resolve, reject) => {
        const req = tx(db, 'readonly').get(key);
        req.onsuccess = () => resolve((req.result as string | undefined) ?? null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const req = tx(db, 'readwrite').put(value, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch { /* хранилище недоступно (privacy-режим) — работаем в памяти */ }
  },
  async removeItem(key: string): Promise<void> {
    try {
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const req = tx(db, 'readwrite').delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch { /* ок */ }
  },
};
