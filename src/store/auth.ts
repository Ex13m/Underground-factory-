import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';
import { bus } from '../lib/bus';
import type { GarageCar, Order, User } from '../lib/types';

interface AuthState {
  user: User | null;
  garage: GarageCar[];
  favorites: string[]; // product ids
  /** активная тачка — car-first сценарий: каталог подстраивается под неё */
  activeCarId: string | null;
  signIn: (user: User) => void;
  signOut: () => void;
  addGarageCar: (car: GarageCar) => void;
  removeGarageCar: (id: string) => void;
  setActiveCar: (id: string | null) => void;
  toggleFavorite: (productId: string) => void;
  orders: Order[];
  addOrder: (order: Order) => void;
  refreshOrders: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      garage: [],
      favorites: [],
      activeCarId: null,
      orders: api.listOrders(),
      signIn: (user) => {
        set({ user });
        bus.emit('auth:signed-in', { user });
      },
      signOut: () => set({ user: null }),
      addGarageCar: (car) => {
        set((s) => ({ garage: [...s.garage, car], activeCarId: s.activeCarId ?? car.id }));
        bus.emit('garage:add', { car });
      },
      removeGarageCar: (id) =>
        set((s) => ({
          garage: s.garage.filter((c) => c.id !== id),
          activeCarId: s.activeCarId === id ? null : s.activeCarId,
        })),
      setActiveCar: (activeCarId) => set({ activeCarId }),
      toggleFavorite: (productId) =>
        set((s) => ({
          favorites: s.favorites.includes(productId)
            ? s.favorites.filter((f) => f !== productId)
            : [...s.favorites, productId],
        })),
      addOrder: (order) => {
        api.createOrder(order);
        set({ orders: api.listOrders() });
      },
      refreshOrders: () => set({ orders: api.listOrders() }),
    }),
    { name: 'uf:auth' },
  ),
);
