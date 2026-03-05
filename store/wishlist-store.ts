import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import {
  addWishlistItemToDB,
  removeWishlistItemFromDB,
  clearWishlistDB,
} from "@/actions/wishlist";

export type WishlistItem = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  stock: number;
};

type WishlistStore = {
  items: WishlistItem[];
  _hydrated: boolean;
  _isAuthenticated: boolean;

  addItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  toggleItem: (item: WishlistItem) => void;
  clearWishlist: (syncToDb?: boolean) => void;
  replaceWishlist: (items: WishlistItem[]) => void;
  setAuthenticated: (value: boolean) => void;
  totalItems: () => number;
};

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      _hydrated: false,
      _isAuthenticated: false,

      setAuthenticated: (value) => set({ _isAuthenticated: value }),

      replaceWishlist: (items) => set({ items }),

      addItem: (item) =>
        set((state) => {
          const exists = state.items.some(
            (i) => i.productId === item.productId
          );
          if (exists) return state;

          if (state._isAuthenticated) {
            addWishlistItemToDB(item.productId).catch(() => {
              toast.error("Failed to sync wishlist. Please try again.");
            });
          }

          return { items: [...state.items, item] };
        }),

      removeItem: (productId) =>
        set((state) => {
          if (state._isAuthenticated) {
            removeWishlistItemFromDB(productId).catch(() => {
              toast.error("Failed to sync wishlist. Please try again.");
            });
          }
          return {
            items: state.items.filter((i) => i.productId !== productId),
          };
        }),

      toggleItem: (item) => {
        const state = get();
        const exists = state.items.some(
          (i) => i.productId === item.productId
        );
        if (exists) {
          get().removeItem(item.productId);
        } else {
          get().addItem(item);
        }
      },

      clearWishlist: (syncToDb = true) => {
        const state = get();
        if (syncToDb && state._isAuthenticated) {
          clearWishlistDB().catch(() => {
            toast.error("Failed to sync wishlist. Please try again.");
          });
        }
        set({ items: [] });
      },

      totalItems: () => get().items.length,
    }),
    {
      name: "wishlist-storage",
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => () => {
        queueMicrotask(() => {
          useWishlistStore.setState({ _hydrated: true });
        });
      },
    }
  )
);
