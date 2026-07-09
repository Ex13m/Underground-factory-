/**
 * UF_API — интеграционный слой UNDERGROUND FACTORY.
 * Прототип работает на localStorage поверх сид-каталога, но контракт REST-образный:
 * замените реализацию методов на fetch к реальному бэкенду — интерфейс не изменится.
 * Слой также доступен снаружи как window.UF_API (см. API.md).
 */

import { SEED_CARS, SEED_PRODUCTS } from '../data/seed';
import { DEFAULT_MATERIALS, type MaterialInfo } from '../data/materials';
import type { CarModel, MaterialGrade, Order, Product, Promo } from './types';

const LS = {
  customProducts: 'uf:products:custom',
  hiddenProducts: 'uf:products:hidden',
  productOverrides: 'uf:products:overrides',
  customCars: 'uf:cars:custom',
  orders: 'uf:orders',
  promos: 'uf:promos',
  materials: 'uf:materials',
  genQueue: 'uf:genqueue',
};

/**
 * Постоянные маркетинговые промокоды (рилсы/соцсети): работают у любого
 * посетителя сразу, без регистрации в его браузере. Коды в контенте
 * (CTA рилсов) должны существовать здесь — реклама не врёт.
 */
const BUILTIN_PROMOS: Promo[] = [
  { code: 'PITSTOP26', pct: 15, source: 'admin' },
  { code: 'FIGABOSS2026', pct: 15, source: 'admin' },
];

/** Заявка админа на генерацию медиа через Higgsfield (исполняет Claude в терминале). */
export interface GenRequestTicket {
  /** ключ медиа-объекта (= seed) — куда применить результат */
  key: string;
  kind: 'image' | 'video';
  prompt: string;
  width: number;
  height: number;
  createdAt: number;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
  // notify same-tab listeners (native 'storage' only fires cross-tab)
  window.dispatchEvent(new CustomEvent('uf:data-changed', { detail: { key } }));
}

export function onDataChanged(fn: () => void): () => void {
  const h = () => fn();
  window.addEventListener('uf:data-changed', h);
  window.addEventListener('storage', h);
  return () => {
    window.removeEventListener('uf:data-changed', h);
    window.removeEventListener('storage', h);
  };
}

export const api = {
  // ---- catalog ----
  listProducts(): Product[] {
    const custom = read<Product[]>(LS.customProducts, []);
    const hidden = new Set(read<string[]>(LS.hiddenProducts, []));
    const overrides = read<Record<string, Product>>(LS.productOverrides, {});
    const seed = SEED_PRODUCTS.filter((p) => !hidden.has(p.id)).map((p) => overrides[p.id] ?? p);
    return [...seed, ...custom.filter((p) => !hidden.has(p.id))];
  },

  getProduct(id: string): Product | undefined {
    return api.listProducts().find((p) => p.id === id);
  },

  addProduct(p: Product): Product {
    const custom = read<Product[]>(LS.customProducts, []);
    custom.push({ ...p, custom: true });
    write(LS.customProducts, custom);
    return p;
  },

  updateProduct(id: string, patch: Partial<Product>): Product | undefined {
    const custom = read<Product[]>(LS.customProducts, []);
    const idx = custom.findIndex((p) => p.id === id);
    if (idx >= 0) {
      custom[idx] = { ...custom[idx], ...patch, id };
      write(LS.customProducts, custom);
      return custom[idx];
    }
    const seedItem = SEED_PRODUCTS.find((p) => p.id === id);
    if (!seedItem) return undefined;
    const overrides = read<Record<string, Product>>(LS.productOverrides, {});
    overrides[id] = { ...(overrides[id] ?? seedItem), ...patch, id };
    write(LS.productOverrides, overrides);
    return overrides[id];
  },

  deleteProduct(id: string) {
    const custom = read<Product[]>(LS.customProducts, []);
    const next = custom.filter((p) => p.id !== id);
    if (next.length !== custom.length) {
      write(LS.customProducts, next);
      return;
    }
    const hidden = read<string[]>(LS.hiddenProducts, []);
    if (!hidden.includes(id)) hidden.push(id);
    write(LS.hiddenProducts, hidden);
  },

  // ---- cars (fitment reference) ----
  listCars(): CarModel[] {
    return [...SEED_CARS, ...read<CarModel[]>(LS.customCars, [])];
  },

  addCar(c: CarModel): CarModel {
    const custom = read<CarModel[]>(LS.customCars, []);
    custom.push({ ...c, custom: true });
    write(LS.customCars, custom);
    return c;
  },

  deleteCar(id: string) {
    write(LS.customCars, read<CarModel[]>(LS.customCars, []).filter((c) => c.id !== id));
  },

  // ---- materials (паспорта материалов: карбон/композит/АБС) ----
  listMaterials(): Record<MaterialGrade, MaterialInfo> {
    const overrides = read<Partial<Record<MaterialGrade, MaterialInfo>>>(LS.materials, {});
    return {
      abs: { ...DEFAULT_MATERIALS.abs, ...overrides.abs },
      composite: { ...DEFAULT_MATERIALS.composite, ...overrides.composite },
      carbon: { ...DEFAULT_MATERIALS.carbon, ...overrides.carbon },
    };
  },

  getMaterial(grade: MaterialGrade): MaterialInfo {
    return api.listMaterials()[grade];
  },

  updateMaterial(grade: MaterialGrade, patch: Partial<MaterialInfo>): MaterialInfo {
    const overrides = read<Partial<Record<MaterialGrade, MaterialInfo>>>(LS.materials, {});
    overrides[grade] = { ...api.getMaterial(grade), ...patch, grade };
    write(LS.materials, overrides);
    return overrides[grade]!;
  },

  // ---- очередь заявок на генерацию (Higgsfield, исполняется в терминале) ----
  listGenQueue(): GenRequestTicket[] {
    return read<GenRequestTicket[]>(LS.genQueue, []);
  },

  queueGen(ticket: GenRequestTicket): GenRequestTicket {
    const q = read<GenRequestTicket[]>(LS.genQueue, []).filter((x) => x.key !== ticket.key);
    q.push(ticket);
    write(LS.genQueue, q);
    return ticket;
  },

  clearGenQueue() {
    write(LS.genQueue, []);
  },

  // ---- orders ----
  listOrders(): Order[] {
    return read<Order[]>(LS.orders, []);
  },

  createOrder(order: Order): Order {
    const orders = read<Order[]>(LS.orders, []);
    orders.unshift(order);
    write(LS.orders, orders);
    return order;
  },

  // ---- promos ----
  listPromos(): Promo[] {
    return read<Promo[]>(LS.promos, []);
  },

  registerPromo(promo: Promo): Promo {
    const promos = read<Promo[]>(LS.promos, []).filter((p) => p.code !== promo.code);
    promos.push(promo);
    write(LS.promos, promos);
    return promo;
  },

  validatePromo(code: string): Promo | undefined {
    const c = code.toUpperCase();
    return (
      read<Promo[]>(LS.promos, []).find((p) => p.code.toUpperCase() === c) ??
      BUILTIN_PROMOS.find((p) => p.code === c)
    );
  },

  // ---- integration: bulk exchange ----
  exportCatalog(): string {
    return JSON.stringify({ products: api.listProducts(), cars: api.listCars() }, null, 2);
  },

  importCatalog(json: string): { products: number; cars: number } {
    const data = JSON.parse(json) as { products?: Product[]; cars?: CarModel[] };
    const seedProductIds = new Set(SEED_PRODUCTS.map((p) => p.id));
    const seedCarIds = new Set(SEED_CARS.map((c) => c.id));
    const products = (data.products ?? []).filter((p) => !seedProductIds.has(p.id));
    const cars = (data.cars ?? []).filter((c) => !seedCarIds.has(c.id));
    write(LS.customProducts, products.map((p) => ({ ...p, custom: true })));
    write(LS.customCars, cars.map((c) => ({ ...c, custom: true })));
    return { products: products.length, cars: cars.length };
  },

  /** REST-образный фасад для внешних систем: UF_API.rest('GET', '/catalog') */
  rest(method: 'GET' | 'POST' | 'DELETE', path: string, body?: any): any {
    const route = `${method} ${path.replace(/\/+$/, '')}`;
    switch (route) {
      case 'GET /catalog': return api.listProducts();
      case 'POST /catalog': return api.addProduct(body);
      case 'GET /cars': return api.listCars();
      case 'POST /cars': return api.addCar(body);
      case 'GET /orders': return api.listOrders();
      case 'POST /orders': return api.createOrder(body);
      case 'GET /promos': return api.listPromos();
      case 'POST /promos': return api.registerPromo(body);
      default: {
        const m = path.match(/^\/catalog\/(.+)$/);
        if (m && method === 'GET') return api.getProduct(m[1]);
        if (m && method === 'DELETE') return api.deleteProduct(m[1]);
        throw new Error(`UF_API: unknown route ${route} — see API.md`);
      }
    }
  },
};

declare global {
  interface Window {
    UF_API: typeof api;
  }
}

export function exposeApi() {
  window.UF_API = api;
}
