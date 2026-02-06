"use client";

import { ShoppingCart, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";

type AddToCartButtonProps = {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    stock: number;
  };
};

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  if (product.stock === 0) {
    return (
      <Button type="button" className="w-full" disabled>
        Out of Stock
      </Button>
    );
  }

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    setAdded(true);
    toast.success(`${product.name} added to cart`);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <Button type="button" className="w-full" onClick={handleAdd} variant={added ? "secondary" : "default"}>
      {added ? (
        <>
          <Check className="size-4" />
          Added
        </>
      ) : (
        <>
          <ShoppingCart className="size-4" />
          Add to Cart
        </>
      )}
    </Button>
  );
}
