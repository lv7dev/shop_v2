"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/store/cart-store";

export function OrderSummary() {
  const items = useCartStore((s) => s.items);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  const shipping = totalPrice >= 100 ? 0 : 10;
  const tax = totalPrice * 0.08;
  const total = totalPrice + shipping + tax;

  return (
    <div className="rounded-lg border p-6">
      <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Subtotal ({totalItems} {totalItems === 1 ? "item" : "items"})
          </span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span>
            {shipping === 0 ? (
              <span className="text-green-600">Free</span>
            ) : (
              `$${shipping.toFixed(2)}`
            )}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tax (8%)</span>
          <span>${tax.toFixed(2)}</span>
        </div>

        <Separator />

        <div className="flex justify-between text-base font-semibold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {totalPrice > 0 && totalPrice < 100 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Add ${(100 - totalPrice).toFixed(2)} more for free shipping!
        </p>
      )}

      <Button className="mt-4 w-full" size="lg" asChild disabled={items.length === 0}>
        <Link href="/checkout">Proceed to Checkout</Link>
      </Button>
    </div>
  );
}
