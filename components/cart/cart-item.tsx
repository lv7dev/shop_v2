"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore, type CartItem as CartItemType } from "@/store/cart-store";

export function CartItem({ item }: { item: CartItemType }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="flex gap-4 rounded-lg border p-4">
      <div className="relative size-24 shrink-0 overflow-hidden rounded-md bg-muted">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ShoppingCart className="size-8" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div>
          <Link
            href={`/products/${item.id}`}
            className="font-medium hover:text-primary transition-colors line-clamp-1"
          >
            {item.name}
          </Link>
          <p className="text-sm text-muted-foreground">
            ${item.price.toFixed(2)} each
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              <Minus className="size-3" />
            </Button>
            <span className="w-8 text-center text-sm font-medium">
              {item.quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              disabled={item.quantity >= item.stock}
            >
              <Plus className="size-3" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-semibold">
              ${(item.price * item.quantity).toFixed(2)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-destructive"
              onClick={() => removeItem(item.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
