import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  syncCartItemToDB,
  removeCartItemFromDB,
  clearCartDB,
} from "@/actions/cart-db";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
};

type CartStore = {
  items: CartItem[];
  _hydrated: boolean;
  _isAuthenticated: boolean;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: (syncToDb?: boolean) => void;
  replaceCart: (items: CartItem[]) => void;
  setAuthenticated: (value: boolean) => void;
  totalItems: () => number;
  totalPrice: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      _hydrated: false,
      _isAuthenticated: false,

      setAuthenticated: (value) => set({ _isAuthenticated: value }),

      replaceCart: (items) => set({ items }),

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          let newQuantity: number;

          if (existing) {
            newQuantity = Math.min(existing.quantity + 1, item.stock);
          } else {
            newQuantity = 1;
          }

          const newItems = existing
            ? state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: newQuantity } : i
              )
            : [...state.items, { ...item, quantity: 1 }];

          if (state._isAuthenticated) {
            syncCartItemToDB(item.id, newQuantity).catch(() => {});
          }

          return { items: newItems };
        }),

      removeItem: (id) =>
        set((state) => {
          if (state._isAuthenticated) {
            removeCartItemFromDB(id).catch(() => {});
          }
          return { items: state.items.filter((i) => i.id !== id) };
        }),

      updateQuantity: (id, quantity) =>
        set((state) => {
          const item = state.items.find((i) => i.id === id);
          if (!item) return state;

          const clampedQty = Math.max(1, Math.min(quantity, item.stock));

          if (state._isAuthenticated) {
            syncCartItemToDB(id, clampedQty).catch(() => {});
          }

          return {
            items: state.items.map((i) =>
              i.id === id ? { ...i, quantity: clampedQty } : i
            ),
          };
        }),

      clearCart: (syncToDb = true) => {
        const state = get();
        if (syncToDb && state._isAuthenticated) {
          clearCartDB().catch(() => {});
        }
        set({ items: [] });
      },

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => () => {
        queueMicrotask(() => {
          useCartStore.setState({ _hydrated: true });
        });
      },
    }
  )
);
