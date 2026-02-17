import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import {
  syncCartItemToDB,
  removeCartItemFromDB,
  clearCartDB,
} from "@/actions/cart-db";

export type CartItem = {
  id: string; // productId
  variantId?: string;
  name: string;
  variantLabel?: string; // e.g. "Size: M / Color: Red"
  price: number;
  image: string;
  quantity: number;
  stock: number;
};

/** Unique key for a cart item: productId or productId::variantId */
function cartItemKey(item: { id: string; variantId?: string }): string {
  return item.variantId ? `${item.id}::${item.variantId}` : item.id;
}

type CartStore = {
  items: CartItem[];
  _hydrated: boolean;
  _isAuthenticated: boolean;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string, variantId?: string) => void;
  updateQuantity: (id: string, quantity: number, variantId?: string) => void;
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
          const key = cartItemKey(item);
          const existing = state.items.find(
            (i) => cartItemKey(i) === key
          );
          let newQuantity: number;

          if (existing) {
            newQuantity = Math.min(existing.quantity + 1, item.stock);
          } else {
            newQuantity = 1;
          }

          const newItems = existing
            ? state.items.map((i) =>
                cartItemKey(i) === key
                  ? { ...i, quantity: newQuantity }
                  : i
              )
            : [...state.items, { ...item, quantity: 1 }];

          if (state._isAuthenticated) {
            syncCartItemToDB(item.id, newQuantity, item.variantId).catch(
              () => {
                toast.error("Failed to sync cart. Please try again.");
              }
            );
          }

          return { items: newItems };
        }),

      removeItem: (id, variantId) =>
        set((state) => {
          const key = cartItemKey({ id, variantId });
          if (state._isAuthenticated) {
            removeCartItemFromDB(id, variantId).catch(() => {
              toast.error("Failed to sync cart. Please try again.");
            });
          }
          return { items: state.items.filter((i) => cartItemKey(i) !== key) };
        }),

      updateQuantity: (id, quantity, variantId) =>
        set((state) => {
          const key = cartItemKey({ id, variantId });
          const item = state.items.find((i) => cartItemKey(i) === key);
          if (!item) return state;

          const clampedQty = Math.max(1, Math.min(quantity, item.stock));

          if (state._isAuthenticated) {
            syncCartItemToDB(id, clampedQty, variantId).catch(() => {
              toast.error("Failed to sync cart. Please try again.");
            });
          }

          return {
            items: state.items.map((i) =>
              cartItemKey(i) === key
                ? { ...i, quantity: clampedQty }
                : i
            ),
          };
        }),

      clearCart: (syncToDb = true) => {
        const state = get();
        if (syncToDb && state._isAuthenticated) {
          clearCartDB().catch(() => {
            toast.error("Failed to sync cart. Please try again.");
          });
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
