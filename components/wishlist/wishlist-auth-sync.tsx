"use client";

import { useEffect, useRef } from "react";
import { useWishlistStore } from "@/store/wishlist-store";
import { loadWishlistFromDB, mergeWishlistInDB } from "@/actions/wishlist";

type WishlistAuthSyncProps = {
  isAuthenticated: boolean;
};

export function WishlistAuthSync({ isAuthenticated }: WishlistAuthSyncProps) {
  const setAuthenticated = useWishlistStore((s) => s.setAuthenticated);
  const replaceWishlist = useWishlistStore((s) => s.replaceWishlist);
  const hydrated = useWishlistStore((s) => s._hydrated);
  const items = useWishlistStore((s) => s.items);
  const loadedRef = useRef(false);

  useEffect(() => {
    setAuthenticated(isAuthenticated);
  }, [isAuthenticated, setAuthenticated]);

  useEffect(() => {
    if (!hydrated || loadedRef.current || !isAuthenticated) return;
    loadedRef.current = true;

    const localProductIds = items.map((i) => i.productId);

    if (localProductIds.length > 0) {
      // Merge local wishlist into DB, then reload enriched data
      mergeWishlistInDB(localProductIds).then(() => {
        loadWishlistFromDB().then((result) => {
          if (result.success) {
            replaceWishlist(result.items);
          }
        });
      });
    } else {
      // No local items, just load from DB
      loadWishlistFromDB().then((result) => {
        if (result.success && result.items.length > 0) {
          replaceWishlist(result.items);
        }
      });
    }
  }, [hydrated, isAuthenticated, items, replaceWishlist]);

  return null;
}
