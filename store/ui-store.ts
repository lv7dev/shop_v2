import { create } from "zustand";

type UIStore = {
  isMobileMenuOpen: boolean;
  isCartDrawerOpen: boolean;
  isSearchOpen: boolean;
  toggleMobileMenu: () => void;
  toggleCartDrawer: () => void;
  toggleSearch: () => void;
  closeMobileMenu: () => void;
  closeCartDrawer: () => void;
  closeSearch: () => void;
};

export const useUIStore = create<UIStore>()((set) => ({
  isMobileMenuOpen: false,
  isCartDrawerOpen: false,
  isSearchOpen: false,

  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  toggleCartDrawer: () =>
    set((state) => ({ isCartDrawerOpen: !state.isCartDrawerOpen })),
  toggleSearch: () =>
    set((state) => ({ isSearchOpen: !state.isSearchOpen })),

  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  closeCartDrawer: () => set({ isCartDrawerOpen: false }),
  closeSearch: () => set({ isSearchOpen: false }),
}));
