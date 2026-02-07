"use client";

import Link from "next/link";
import { ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { CartItem } from "./cart-item";
import { OrderSummary } from "./order-summary";

export function CartContent() {
  const items = useCartStore((s) => s.items);
  const hydrated = useCartStore((s) => s._hydrated);
  const clearCart = useCartStore((s) => s.clearCart);

  if (!hydrated) {
    return (
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ShoppingBag className="mb-4 size-16 text-muted-foreground" />
        <h2 className="mb-2 text-xl font-semibold">Your cart is empty</h2>
        <p className="mb-6 text-muted-foreground">
          Looks like you haven&apos;t added anything yet.
        </p>
        <Button asChild>
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "items"} in your cart
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => clearCart()}
          >
            <Trash2 className="mr-1 size-4" />
            Clear Cart
          </Button>
        </div>

        {items.map((item) => (
          <CartItem key={item.id} item={item} />
        ))}

        <Button variant="outline" asChild>
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>

      <div>
        <OrderSummary />
      </div>
    </div>
  );
}
