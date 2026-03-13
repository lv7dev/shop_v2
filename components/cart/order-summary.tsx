"use client";

import { Link } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";
import { PRICING } from "@/lib/pricing";

export function OrderSummary() {
  const t = useTranslations();
  const locale = useLocale();
  const items = useCartStore((s) => s.items);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  const shipping = totalPrice >= PRICING.freeShippingThreshold ? 0 : PRICING.defaultShippingCost;
  const tax = totalPrice * PRICING.taxRate;
  const total = totalPrice + shipping + tax;

  return (
    <div className="rounded-lg border p-6">
      <h2 className="mb-4 text-lg font-semibold">{t("cart.orderSummary")}</h2>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            {t("cart.subtotal")} ({t("cart.itemCount", { count: totalItems })})
          </span>
          <span>{formatPrice(totalPrice, locale)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("cart.shipping")}</span>
          <span>
            {shipping === 0 ? (
              <span className="text-green-600">{t("cart.shippingFree")}</span>
            ) : (
              formatPrice(shipping, locale)
            )}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("cart.tax")}</span>
          <span>{formatPrice(tax, locale)}</span>
        </div>

        <Separator />

        <div className="flex justify-between text-base font-semibold">
          <span>{t("cart.total")}</span>
          <span>{formatPrice(total, locale)}</span>
        </div>
      </div>

      {totalPrice > 0 && totalPrice < PRICING.freeShippingThreshold && (
        <p className="mt-3 text-xs text-muted-foreground">
          {t("cart.addMore", { amount: formatPrice(PRICING.freeShippingThreshold - totalPrice, locale) })}
        </p>
      )}

      <Button className="mt-4 w-full" size="lg" asChild disabled={items.length === 0}>
        <Link href="/checkout">{t("cart.proceedToCheckout")}</Link>
      </Button>
    </div>
  );
}
