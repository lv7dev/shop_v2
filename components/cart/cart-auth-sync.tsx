"use client";

import { useEffect, useRef } from "react";
import { useCartStore } from "@/store/cart-store";
import { loadCartFromDB } from "@/actions/cart-db";

type CartAuthSyncProps = {
  isAuthenticated: boolean;
};

export function CartAuthSync({ isAuthenticated }: CartAuthSyncProps) {
  const setAuthenticated = useCartStore((s) => s.setAuthenticated);
  const replaceCart = useCartStore((s) => s.replaceCart);
  const hydrated = useCartStore((s) => s._hydrated);
  const items = useCartStore((s) => s.items);
  const loadedRef = useRef(false);

  useEffect(() => {
    setAuthenticated(isAuthenticated);
  }, [isAuthenticated, setAuthenticated]);

  useEffect(() => {
    if (!hydrated || loadedRef.current || !isAuthenticated) return;
    loadedRef.current = true;

    // If localStorage is empty, load from DB
    // (If localStorage has items, the login form already handled the merge)
    if (items.length === 0) {
      loadCartFromDB().then((result) => {
        if (result.success && result.items.length > 0) {
          replaceCart(result.items);
        }
      });
    }
  }, [hydrated, isAuthenticated, items.length, replaceCart]);

  return null;
}
