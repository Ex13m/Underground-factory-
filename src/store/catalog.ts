import { create } from 'zustand';
import { api, onDataChanged } from '../lib/api';
import type { CarModel, Product } from '../lib/types';

interface CatalogState {
  products: Product[];
  cars: CarModel[];
  refresh: () => void;
}

export const useCatalog = create<CatalogState>((set) => ({
  products: api.listProducts(),
  cars: api.listCars(),
  refresh: () => set({ products: api.listProducts(), cars: api.listCars() }),
}));

// keep the store in sync with admin edits / external UF_API calls
onDataChanged(() => useCatalog.getState().refresh());
