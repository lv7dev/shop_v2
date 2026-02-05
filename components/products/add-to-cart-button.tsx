"use client";

import { ShoppingCart, Check } from "lucide-react";
import { useState } from "react";
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
      <Button className="w-full" disabled>
        Out of Stock
      </Button>
    );
  }

  function handleAdd() {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <Button className="w-full" onClick={handleAdd} variant={added ? "secondary" : "default"}>
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
