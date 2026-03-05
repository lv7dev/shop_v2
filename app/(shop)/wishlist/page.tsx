"use client";

import Link from "next/link";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/ui/product-image";
import { useWishlistStore, type WishlistItem } from "@/store/wishlist-store";
import { useCartStore } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";

export default function WishlistPage() {
  const items = useWishlistStore((s) => s.items);
  const removeItem = useWishlistStore((s) => s.removeItem);
  const clearWishlist = useWishlistStore((s) => s.clearWishlist);
  const hydrated = useWishlistStore((s) => s._hydrated);

  const addCartItem = useCartStore((s) => s.addItem);

  function handleMoveToCart(item: WishlistItem) {
    addCartItem({
      id: item.productId,
      name: item.name,
      price: item.price,
      image: item.image,
      stock: item.stock,
    });
    removeItem(item.productId);
    toast.success(`${item.name} moved to cart`);
  }

  function handleRemove(item: WishlistItem) {
    removeItem(item.productId);
    toast.success(`${item.name} removed from wishlist`);
  }

  function handleClear() {
    clearWishlist();
    toast.success("Wishlist cleared");
  }

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold">My Wishlist</h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Wishlist</h1>
        {items.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClear}>
            <Trash2 className="mr-2 size-4" />
            Clear All
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Heart className="mb-4 size-16 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">
            Your wishlist is empty
          </h2>
          <p className="mb-6 text-muted-foreground">
            Browse our products and save your favorites here.
          </p>
          <Button asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card
              key={item.productId}
              className="group overflow-hidden py-0 transition-shadow hover:shadow-md"
            >
              <Link href={`/products/${item.slug}`} className="block">
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {item.image ? (
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <ShoppingCart className="size-12" />
                    </div>
                  )}
                  {item.stock === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Badge variant="secondary" className="text-sm">
                        Out of Stock
                      </Badge>
                    </div>
                  )}
                </div>
              </Link>
              <CardContent className="space-y-2 p-4">
                <Link href={`/products/${item.slug}`} className="block">
                  <h3 className="font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {item.name}
                  </h3>
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">
                    {formatPrice(item.price)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={item.stock === 0}
                    onClick={(e) => {
                      e.preventDefault();
                      handleMoveToCart(item);
                    }}
                  >
                    <ShoppingCart className="mr-1 size-3.5" />
                    {item.stock === 0 ? "Out of Stock" : "Move to Cart"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemove(item);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
