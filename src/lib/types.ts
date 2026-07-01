/** Shared domain types for UNDERGROUND FACTORY. Owned by the foundation — do not edit in sub-agent tasks. */

export type Lang = 'ru' | 'en';

export type Rarity = 'cardboard' | 'corrugated' | 'plywood' | 'chrome-tape' | 'wet-cardboard';

export const RARITY_ORDER: Rarity[] = ['cardboard', 'corrugated', 'plywood', 'chrome-tape', 'wet-cardboard'];

export interface LocalText {
  ru: string;
  en: string;
}

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  /** deterministic seed for the generated fallback art when the remote URL is unreachable */
  seed?: string;
}

export interface CarModel {
  id: string; // e.g. 'nissan-silvia-s15'
  make: string; // 'Nissan'
  model: string; // 'Silvia S15'
  years: string; // '1999–2002'
  img: string;
  custom?: boolean;
}

export interface Product {
  id: string;
  sku: string; // 'UF-KIT/09'
  name: LocalText;
  desc: LocalText;
  price: number; // USD
  weightGrams: number; // headline performance metric
  rainMinutes: number; // -1 = ∞ (laminated)
  rarity: Rarity;
  material: LocalText;
  fits: string[]; // CarModel ids
  media: MediaItem[];
  hit?: boolean;
  custom?: boolean;
}

export interface GarageCar {
  id: string;
  modelId?: string; // link to CarModel when picked from the list
  make: string;
  model: string;
  year: string;
  img?: string;
}

export interface CartItem {
  productId: string;
  qty: number;
}

export type OrderStatus = 'cutting' | 'gluing' | 'shipping' | 'done';

export interface Order {
  id: string;
  items: { productId: string; qty: number; price: number; name: LocalText }[];
  subtotal: number;
  discountPct: number;
  promo?: string;
  total: number;
  createdAt: number;
  status: OrderStatus;
}

export type AuthProvider = 'google' | 'apple' | 'github';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: AuthProvider;
}

export interface Promo {
  code: string;
  pct: number;
  source: string; // 'bot' | 'admin' | ...
}

export const RARITY_META: Record<Rarity, { color: string; label: LocalText; glow?: boolean }> = {
  cardboard: { color: '#b9a084', label: { ru: 'Картон', en: 'Cardboard' } },
  corrugated: { color: '#d07a3f', label: { ru: 'Гофра', en: 'Corrugated' } },
  plywood: { color: '#e0c26a', label: { ru: 'Фанера', en: 'Plywood' } },
  'chrome-tape': { color: '#d9e2e8', label: { ru: 'Скотч-хром', en: 'Chrome Tape' }, glow: true },
  'wet-cardboard': { color: '#e01b22', label: { ru: 'Мокрый картон', en: 'Wet Cardboard' }, glow: true },
};

export const ORDER_STATUS_META: Record<OrderStatus, LocalText> = {
  cutting: { ru: 'Режем картон', en: 'Cutting cardboard' },
  gluing: { ru: 'Сохнет клей', en: 'Glue is drying' },
  shipping: { ru: 'В пути (не мочить!)', en: 'Shipping (keep dry!)' },
  done: { ru: 'Доставлен', en: 'Delivered' },
};
