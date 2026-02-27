"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { Loader2, ShoppingBag, ShoppingCart, Tag, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useCartStore } from "@/store/cart-store";
import { createOrder } from "@/actions/order";
import { createAddress } from "@/actions/address";
import { applyDiscountCode, getAutoApplyDiscounts } from "@/actions/discount";
import {
  checkoutSchema,
  type CheckoutInput,
} from "@/lib/validations/checkout";
import { CheckoutAddressSelector } from "./checkout-address-selector";
import { PaymentMethodSelector } from "./payment-method-selector";
import type { PaymentMethodType } from "@/lib/validations/checkout";

type Address = {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
};

type AppliedDiscount = {
  id: string;
  code: string;
  type: string;
  method?: string;
  stackable?: boolean;
  value: number;
  amount: number;
  description: string | null;
};

type CheckoutFormProps = {
  addresses?: Address[];
  isAuthenticated?: boolean;
  enabledPaymentMethods?: string[];
};

export function CheckoutForm({
  addresses = [],
  isAuthenticated = false,
  enabledPaymentMethods = ["COD"],
}: CheckoutFormProps) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const hydrated = useCartStore((s) => s._hydrated);
  const clearCart = useCartStore((s) => s.clearCart);

  const defaultMethod = (enabledPaymentMethods[0] ?? "COD") as PaymentMethodType;
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>(defaultMethod);
  const [discountCodeInput, setDiscountCodeInput] = useState("");
  const [appliedDiscounts, setAppliedDiscounts] = useState<AppliedDiscount[]>([]);
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const autoApplyRef = useRef(false);

  // Address selection state
  const defaultAddress = addresses.find((a) => a.isDefault);
  const initialAddress = defaultAddress ?? (addresses.length > 0 ? addresses[0] : null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    initialAddress?.id ?? null
  );
  const [saveNewAddress, setSaveNewAddress] = useState(false);

  const isNewAddress = selectedAddressId === null;

  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  const discountAmount = appliedDiscounts.reduce((sum, d) => sum + d.amount, 0);
  const shippingCost = totalPrice >= 100 ? 0 : 10;
  const tax = (totalPrice - discountAmount) * 0.08;
  const total = totalPrice - discountAmount + shippingCost + tax;

  const hasAutoApplied = appliedDiscounts.some((d) => d.method === "AUTO");
  const hasManualCode = appliedDiscounts.some((d) => d.method !== "AUTO");

  // Auto-apply best eligible AUTO discounts on mount
  useEffect(() => {
    if (autoApplyRef.current || !hydrated || items.length === 0) return;
    autoApplyRef.current = true;

    const cartItems = items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      variantId: item.variantId,
    }));

    getAutoApplyDiscounts(cartItems).then((result) => {
      if (result.success && result.discounts.length > 0) {
        setAppliedDiscounts(result.discounts);
      }
    });
  }, [hydrated, items]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shipping: {
        name: initialAddress?.name ?? "",
        phone: initialAddress?.phone ?? "",
        street: initialAddress?.street ?? "",
        city: initialAddress?.city ?? "",
        state: initialAddress?.state ?? "",
        zipCode: initialAddress?.zipCode ?? "",
        country: initialAddress?.country ?? "",
      },
      note: "",
      paymentMethod: defaultMethod,
    },
  });

  function handleAddressSelect(address: Address | null) {
    if (address) {
      setSelectedAddressId(address.id);
      setSaveNewAddress(false);
      setValue("shipping.name", address.name, { shouldValidate: true });
      setValue("shipping.phone", address.phone || "", { shouldValidate: true });
      setValue("shipping.street", address.street, { shouldValidate: true });
      setValue("shipping.city", address.city, { shouldValidate: true });
      setValue("shipping.state", address.state, { shouldValidate: true });
      setValue("shipping.zipCode", address.zipCode, { shouldValidate: true });
      setValue("shipping.country", address.country, { shouldValidate: true });
    } else {
      setSelectedAddressId(null);
      setValue("shipping.name", "");
      setValue("shipping.phone", "");
      setValue("shipping.street", "");
      setValue("shipping.city", "");
      setValue("shipping.state", "");
      setValue("shipping.zipCode", "");
      setValue("shipping.country", "");
    }
  }

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

  async function handleApplyDiscount() {
    if (!discountCodeInput.trim()) return;
    setApplyingDiscount(true);

    const cartItems = items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      variantId: item.variantId,
    }));

    const existingIds = appliedDiscounts.map((d) => d.id);
    const result = await applyDiscountCode(discountCodeInput, cartItems, existingIds);

    if (result.success && result.discount) {
      if (result.replaceAll) {
        setAppliedDiscounts([result.discount]);
        toast.success(`Discount "${result.discount.code}" applied (replaced previous discounts)`);
      } else {
        setAppliedDiscounts((prev) => [...prev, result.discount!]);
        toast.success(`Discount "${result.discount.code}" applied!`);
      }
      setDiscountCodeInput("");
    } else {
      toast.error(result.error);
    }
    setApplyingDiscount(false);
  }

  function handleRemoveDiscount(discountId: string) {
    setAppliedDiscounts((prev) => prev.filter((d) => d.id !== discountId));
    toast.info("Discount removed");
  }

  async function onSubmit(values: CheckoutInput) {
    try {
      const cartItems = items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        variantId: item.variantId,
      }));

      const discountCodes = appliedDiscounts.length > 0
        ? appliedDiscounts.map((d) => d.code).join(",")
        : undefined;

      // Determine addressId
      let addressIdForOrder = selectedAddressId;

      // If entering a new address and user wants to save it, create it first
      if (isNewAddress && saveNewAddress && isAuthenticated) {
        const saveResult = await createAddress({
          ...values.shipping,
          phone: values.shipping.phone || "",
        });
        if (saveResult.success && saveResult.address) {
          addressIdForOrder = saveResult.address.id;
        }
      }

      const result = await createOrder(
        cartItems,
        addressIdForOrder || undefined,
        values.note || undefined,
        discountCodes,
        paymentMethod
      );

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const order = result.order as unknown as { id: string };

      if (paymentMethod === "COD") {
        clearCart();
        toast.success("Order placed successfully!");
        router.push(`/orders/${order.id}?new=true`);
      } else if (paymentMethod === "STRIPE") {
        const res = await fetch("/api/checkout/stripe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id }),
        });
        const data = await res.json();
        if (data.url) {
          clearCart();
          window.location.href = data.url;
        } else {
          toast.error("Failed to initiate payment. Please try again.");
        }
      } else if (paymentMethod === "MOMO") {
        const res = await fetch("/api/checkout/momo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id }),
        });
        const data = await res.json();
        if (data.payUrl) {
          clearCart();
          window.location.href = data.payUrl;
        } else {
          toast.error("Failed to initiate MoMo payment. Please try again.");
        }
      }
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

          {/* Saved address selector */}
          {addresses.length > 0 && (
            <CheckoutAddressSelector
              addresses={addresses}
              selectedAddressId={selectedAddressId}
              onSelect={handleAddressSelect}
            />
          )}

          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  {...register("shipping.name")}
                  placeholder="John Doe"
                  readOnly={!isNewAddress}
                  className={!isNewAddress ? "bg-muted" : ""}
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
                  readOnly={!isNewAddress}
                  className={!isNewAddress ? "bg-muted" : ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="street">Street Address *</Label>
              <Input
                id="street"
                {...register("shipping.street")}
                placeholder="123 Main St"
                readOnly={!isNewAddress}
                className={!isNewAddress ? "bg-muted" : ""}
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
                  readOnly={!isNewAddress}
                  className={!isNewAddress ? "bg-muted" : ""}
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
                  readOnly={!isNewAddress}
                  className={!isNewAddress ? "bg-muted" : ""}
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
                  readOnly={!isNewAddress}
                  className={!isNewAddress ? "bg-muted" : ""}
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
                readOnly={!isNewAddress}
                className={!isNewAddress ? "bg-muted" : ""}
              />
              {errors.shipping?.country && (
                <p className="text-sm text-destructive">
                  {errors.shipping.country.message}
                </p>
              )}
            </div>

            {/* Save address checkbox - only for authenticated users entering a new address */}
            {isAuthenticated && isNewAddress && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="save-address"
                  checked={saveNewAddress}
                  onCheckedChange={(checked) =>
                    setSaveNewAddress(checked === true)
                  }
                />
                <Label
                  htmlFor="save-address"
                  className="cursor-pointer text-sm"
                >
                  Save this address for future orders
                </Label>
              </div>
            )}
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

        {enabledPaymentMethods.length > 1 && (
          <PaymentMethodSelector
            value={paymentMethod}
            enabledMethods={enabledPaymentMethods}
            onChange={(v) => {
              setPaymentMethod(v as PaymentMethodType);
              setValue("paymentMethod", v as PaymentMethodType);
            }}
          />
        )}
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

          {/* Discount section */}
          <div className="mb-4 space-y-2">
            {/* Applied discounts list */}
            {appliedDiscounts.map((discount) => (
              <div
                key={discount.id}
                className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                  discount.method === "AUTO"
                    ? "bg-emerald-50"
                    : "bg-green-50"
                }`}
              >
                <div className={`flex items-center gap-2 ${
                  discount.method === "AUTO"
                    ? "text-emerald-700"
                    : "text-green-700"
                }`}>
                  {discount.method === "AUTO" ? (
                    <Zap className="size-4" />
                  ) : (
                    <Tag className="size-4" />
                  )}
                  <span className="font-medium">{discount.code}</span>
                  {discount.method === "AUTO" && (
                    <span className="text-xs opacity-75">Auto</span>
                  )}
                  <span>-${discount.amount.toFixed(2)}</span>
                </div>
                {discount.method !== "AUTO" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6 text-green-700 hover:text-red-600"
                    onClick={() => handleRemoveDiscount(discount.id)}
                  >
                    <X className="size-3.5" />
                  </Button>
                )}
              </div>
            ))}

            {/* Code input — always show unless a non-stackable manual code is applied */}
            {(!hasManualCode || appliedDiscounts.every((d) => d.stackable)) && (
              <div className="flex gap-2">
                <Input
                  placeholder="Discount code"
                  value={discountCodeInput}
                  onChange={(e) => setDiscountCodeInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyDiscount();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={handleApplyDiscount}
                  disabled={applyingDiscount || !discountCodeInput.trim()}
                >
                  {applyingDiscount ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>
                  Discount ({appliedDiscounts.map((d) => d.code).join(" + ")})
                  {hasAutoApplied && (
                    <Zap className="ml-1 inline size-3" />
                  )}
                </span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
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
            ) : paymentMethod === "STRIPE" ? (
              `Pay with Card - $${total.toFixed(2)}`
            ) : paymentMethod === "MOMO" ? (
              `Pay with MoMo - $${total.toFixed(2)}`
            ) : (
              `Place Order - $${total.toFixed(2)}`
            )}
          </Button>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            {paymentMethod === "COD" && "Payment will be collected on delivery"}
            {paymentMethod === "STRIPE" && "You will be redirected to Stripe to complete payment"}
            {paymentMethod === "MOMO" && "You will be redirected to MoMo to complete payment"}
          </p>
        </div>
      </div>
    </form>
  );
}
