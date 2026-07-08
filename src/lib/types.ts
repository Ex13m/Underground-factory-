/** Shared domain types for UNDERGROUND FACTORY. Owned by the foundation — do not edit in sub-agent tasks. */

export type Lang = 'ru' | 'en';

export type MaterialGrade = 'abs' | 'composite' | 'carbon';

/** @deprecated alias for backwards compatibility — use MaterialGrade */
export type Rarity = MaterialGrade;

export const GRADE_ORDER: MaterialGrade[] = ['abs', 'composite', 'carbon'];

/** @deprecated alias for backwards compatibility — use GRADE_ORDER */
export const RARITY_ORDER = GRADE_ORDER;

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
  /** ролик «оживления» по фото, генерируется автоматически */
  video?: string;
  custom?: boolean;
}

export interface Product {
  id: string;
  sku: string; // 'UF-KIT/09'
  name: LocalText;
  desc: LocalText;
  price: number; // USD
  weightGrams: number; // headline performance metric
  heatC: number; // термостойкость, °C
  rarity: MaterialGrade; // material grade (field name kept for compatibility)
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

export const GRADE_META: Record<MaterialGrade, { color: string; label: LocalText; glow?: boolean }> = {
  abs: { color: '#b9a084', label: { ru: 'АБС-пластик', en: 'ABS plastic' } },
  composite: { color: '#d9e2e8', label: { ru: 'Композит', en: 'Composite' } },
  carbon: { color: '#e01b22', label: { ru: 'Карбон', en: 'Carbon' }, glow: true },
};

/** @deprecated alias for backwards compatibility — use GRADE_META */
export const RARITY_META = GRADE_META;

export const ORDER_STATUS_META: Record<OrderStatus, LocalText> = {
  cutting: { ru: 'Формуем деталь', en: 'Molding the part' },
  gluing: { ru: 'Запекаем в автоклаве', en: 'Curing in autoclave' },
  shipping: { ru: 'В пути', en: 'Shipping' },
  done: { ru: 'Доставлен', en: 'Delivered' },
};
