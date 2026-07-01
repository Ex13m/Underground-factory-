import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';
import { bus } from '../lib/bus';
import type { CartItem } from '../lib/types';

interface CartState {
  items: CartItem[];
  promoCode?: string;
  discountPct: number;
  add: (productId: string, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  /** returns true if the code is valid and applied */
  applyPromo: (code: string) => boolean;
  clearPromo: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      promoCode: undefined,
      discountPct: 0,
      add: (productId, qty = 1) => {
        set((s) => {
          const existing = s.items.find((i) => i.productId === productId);
          const items = existing
            ? s.items.map((i) => (i.productId === productId ? { ...i, qty: i.qty + qty } : i))
            : [...s.items, { productId, qty }];
          return { items };
        });
        bus.emit('cart:add', { productId });
      },
      remove: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      setQty: (productId, qty) =>
        set((s) => ({
          items: qty <= 0
            ? s.items.filter((i) => i.productId !== productId)
            : s.items.map((i) => (i.productId === productId ? { ...i, qty } : i)),
        })),
      clear: () => set({ items: [], promoCode: undefined, discountPct: 0 }),
      applyPromo: (code) => {
        const promo = api.validatePromo(code.trim());
        if (!promo) return false;
        set({ promoCode: promo.code, discountPct: promo.pct });
        return true;
      },
      clearPromo: () => set({ promoCode: undefined, discountPct: 0 }),
    }),
    { name: 'uf:cart' },
  ),
);

/** derived totals — call inside components: const { subtotal, total } = cartTotals() */
export function cartTotals() {
  const { items, discountPct } = useCart.getState();
  const products = api.listProducts();
  const subtotal = items.reduce((sum, i) => {
    const p = products.find((x) => x.id === i.productId);
    return sum + (p ? p.price * i.qty : 0);
  }, 0);
  const total = Math.round(subtotal * (1 - discountPct / 100) * 100) / 100;
  return { subtotal, total, discountPct };
}

export function cartCount(items: CartItem[]) {
  return items.reduce((n, i) => n + i.qty, 0);
}
