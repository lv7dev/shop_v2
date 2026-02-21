"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  checkoutSchema,
  type CheckoutInput,
} from "@/lib/validations/checkout";

export function CheckoutForm() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const hydrated = useCartStore((s) => s._hydrated);
  const clearCart = useCartStore((s) => s.clearCart);

  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  const shippingCost = totalPrice >= 100 ? 0 : 10;
  const tax = totalPrice * 0.08;
  const total = totalPrice + shippingCost + tax;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shipping: {
        name: "",
        phone: "",
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      },
      note: "",
    },
  });

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

  async function onSubmit(values: CheckoutInput) {
    try {
      const cartItems = items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        variantId: item.variantId,
      }));

      const result = await createOrder(
        cartItems,
        undefined,
        values.note || undefined
      );

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
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-5">
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
                  {...register("shipping.name")}
                  placeholder="John Doe"
                />
                {errors.shipping?.name && (
                  <p className="text-sm text-destructive">
                    {errors.shipping.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  {...register("shipping.phone")}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="street">Street Address *</Label>
              <Input
                id="street"
                {...register("shipping.street")}
                placeholder="123 Main St"
              />
              {errors.shipping?.street && (
                <p className="text-sm text-destructive">
                  {errors.shipping.street.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  {...register("shipping.city")}
                  placeholder="New York"
                />
                {errors.shipping?.city && (
                  <p className="text-sm text-destructive">
                    {errors.shipping.city.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  {...register("shipping.state")}
                  placeholder="NY"
                />
                {errors.shipping?.state && (
                  <p className="text-sm text-destructive">
                    {errors.shipping.state.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  {...register("shipping.zipCode")}
                  placeholder="10001"
                />
                {errors.shipping?.zipCode && (
                  <p className="text-sm text-destructive">
                    {errors.shipping.zipCode.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                {...register("shipping.country")}
                placeholder="United States"
              />
              {errors.shipping?.country && (
                <p className="text-sm text-destructive">
                  {errors.shipping.country.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">Order Notes</h2>
          <Textarea
            {...register("note")}
            placeholder="Any special instructions for your order..."
            rows={3}
          />
          {errors.note && (
            <p className="text-sm text-destructive">{errors.note.message}</p>
          )}
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

          <Button type="submit" className="mt-6 w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
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
