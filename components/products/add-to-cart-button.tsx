"use client";

import { ShoppingCart, Check } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { QuantityStepper } from "./quantity-stepper";

type AddToCartButtonProps = {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    image: string;
    stock: number;
  };
  size?: "sm" | "default";
};

export function AddToCartButton({ product, size = "sm" }: AddToCartButtonProps) {
  const t = useTranslations();
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  if (product.stock === 0) {
    return (
      <Button type="button" className="w-full" disabled size={size === "sm" ? "sm" : "default"}>
        {t("product.outOfStock")}
      </Button>
    );
  }

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({ ...product, quantity });
    setAdded(true);
    setQuantity(1);
    toast.success(t("product.addedToCart", { name: product.name }));
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="space-y-2">
      <QuantityStepper
        value={quantity}
        max={product.stock}
        onChange={setQuantity}
        size={size}
      />
      <Button
        type="button"
        className="w-full"
        size={size === "sm" ? "sm" : "default"}
        onClick={handleAdd}
        variant={added ? "secondary" : "default"}
      >
        {added ? (
          <>
            <Check className="size-4" />
            {t("product.added")}
          </>
        ) : (
          <>
            <ShoppingCart className="size-4" />
            {t("product.addToCart")}
          </>
        )}
      </Button>
    </div>
  );
}
