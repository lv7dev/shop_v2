"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, ShoppingBag, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/store/cart-store";
import { createOrder } from "@/actions/order";

export function CheckoutForm() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const hydrated = useCartStore((s) => s._hydrated);
  const clearCart = useCartStore((s) => s.clearCart);

  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [shipping, setShipping] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });

  const shippingCost = totalPrice >= 100 ? 0 : 10;
  const tax = totalPrice * 0.08;
  const total = totalPrice + shippingCost + tax;

  if (!hydrated) {
    return <div className="h-96 animate-pulse rounded-lg bg-muted" />;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ShoppingBag className="mb-4 size-16 text-muted-foreground" />
        <h2 className="mb-2 text-xl font-semibold">No items to checkout</h2>
        <p className="mb-6 text-muted-foreground">
          Add some products to your cart first.
        </p>
        <Button onClick={() => router.push("/products")}>
          Browse Products
        </Button>
      </div>
    );
  }

  function updateShipping(field: string, value: string) {
    setShipping((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Basic validation
    const requiredFields = ["name", "street", "city", "state", "zipCode", "country"] as const;
    for (const field of requiredFields) {
      if (!shipping[field].trim()) {
        toast.error(`Please fill in ${field === "zipCode" ? "ZIP code" : field}`);
        return;
      }
    }

    setLoading(true);

    try {
      const cartItems = items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        variantId: item.variantId,
      }));

      const result = await createOrder(cartItems, undefined, note || undefined);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      clearCart();
      toast.success("Order placed successfully!");
      const order = result.order as unknown as { id: string };
      router.push(`/orders/${order.id}?new=true`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-5">
      {/* Shipping form */}
      <div className="space-y-6 lg:col-span-3">
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">Shipping Address</h2>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={shipping.name}
                  onChange={(e) => updateShipping("name", e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={shipping.phone}
                  onChange={(e) => updateShipping("phone", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="street">Street Address *</Label>
              <Input
                id="street"
                value={shipping.street}
                onChange={(e) => updateShipping("street", e.target.value)}
                placeholder="123 Main St"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={shipping.city}
                  onChange={(e) => updateShipping("city", e.target.value)}
                  placeholder="New York"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={shipping.state}
                  onChange={(e) => updateShipping("state", e.target.value)}
                  placeholder="NY"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  value={shipping.zipCode}
                  onChange={(e) => updateShipping("zipCode", e.target.value)}
                  placeholder="10001"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                value={shipping.country}
                onChange={(e) => updateShipping("country", e.target.value)}
                placeholder="United States"
                required
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">Order Notes</h2>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any special instructions for your order..."
            rows={3}
          />
        </div>
      </div>

      {/* Order review */}
      <div className="lg:col-span-2">
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">
            Order Review ({totalItems} {totalItems === 1 ? "item" : "items"})
          </h2>

          <div className="mb-4 max-h-64 space-y-3 overflow-y-auto">
            {items.map((item, index) => (
              <div key={`${item.id}-${item.variantId ?? index}`} className="flex gap-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded bg-muted">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <ShoppingCart className="size-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                  {item.variantLabel && (
                    <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} x ${item.price.toFixed(2)}
                  </p>
                </div>
                <span className="text-sm font-medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>
                {shippingCost === 0 ? (
                  <span className="text-green-600">Free</span>
                ) : (
                  `$${shippingCost.toFixed(2)}`
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

          <Button type="submit" className="mt-6 w-full" size="lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Place Order - $${total.toFixed(2)}`
            )}
          </Button>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            Payment will be collected on delivery (COD)
          </p>
        </div>
      </div>
    </form>
  );
}
