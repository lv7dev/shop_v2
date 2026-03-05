"use client";

import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useWishlistStore } from "@/store/wishlist-store";
import { cn } from "@/lib/utils";

type WishlistButtonProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string;
    stock: number;
  };
  /** "icon" = small floating button (product card overlay), "button" = full button with text (product detail) */
  variant?: "icon" | "button";
  className?: string;
};

export function WishlistButton({
  product,
  variant = "icon",
  className,
}: WishlistButtonProps) {
  const items = useWishlistStore((s) => s.items);
  const toggleItem = useWishlistStore((s) => s.toggleItem);
  const hydrated = useWishlistStore((s) => s._hydrated);

  const isWishlisted = items.some((i) => i.productId === product.id);

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    toggleItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.image,
      stock: product.stock,
    });

    if (isWishlisted) {
      toast.success(`${product.name} removed from wishlist`);
    } else {
      toast.success(`${product.name} added to wishlist`);
    }
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "flex size-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-all hover:bg-white hover:scale-110",
          className
        )}
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart
          fill={hydrated && isWishlisted ? "currentColor" : "none"}
          className={cn(
            "size-4 transition-colors",
            hydrated && isWishlisted
              ? "text-red-500"
              : "text-gray-600"
          )}
        />
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleToggle}
      className={cn("gap-2", className)}
    >
      <Heart
        fill={hydrated && isWishlisted ? "currentColor" : "none"}
        className={cn(
          "size-4 transition-colors",
          hydrated && isWishlisted ? "text-red-500" : ""
        )}
      />
      {hydrated && isWishlisted ? "In Wishlist" : "Add to Wishlist"}
    </Button>
  );
}
