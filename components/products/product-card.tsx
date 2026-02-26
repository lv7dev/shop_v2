import Link from "next/link";
import { ShoppingCart, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/ui/product-image";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "./add-to-cart-button";

type ProductCardProps = {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  stock: number;
  category?: { name: string; slug: string } | null;
  priority?: boolean;
  sizes?: string;
  activeDiscount?: {
    code: string;
    type: "PERCENTAGE" | "FIXED";
    value: number;
  } | null;
};

export function ProductCard({
  id,
  name,
  slug,
  price,
  images,
  stock,
  category,
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  activeDiscount,
}: ProductCardProps) {
  const discountLabel = activeDiscount
    ? activeDiscount.type === "PERCENTAGE"
      ? `${activeDiscount.value}% OFF`
      : `$${activeDiscount.value} OFF`
    : null;

  return (
    <Card className="group overflow-hidden py-0 transition-shadow hover:shadow-md">
      <Link href={`/products/${slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {images[0] ? (
            <ProductImage
              src={images[0]}
              alt={name}
              fill
              sizes={sizes}
              className="object-cover transition-transform group-hover:scale-105"
              priority={priority}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <ShoppingCart className="size-12" />
            </div>
          )}
          {activeDiscount && (
            <Badge className="absolute left-2 top-2 flex items-center gap-1 bg-green-600 hover:bg-green-700">
              <Tag className="size-3" />
              {discountLabel}
            </Badge>
          )}
          {stock === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Badge variant="secondary" className="text-sm">
                Out of Stock
              </Badge>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="space-y-2 p-4">
        {category && (
          <Link
            href={`/products?category=${category.slug}`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {category.name}
          </Link>
        )}
        <Link href={`/products/${slug}`} className="block">
          <h3 className="font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {name}
          </h3>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{formatPrice(price)}</span>
        </div>
        {activeDiscount && (
          <div className="flex items-center gap-1.5 rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-950/30 dark:text-green-400">
            <Tag className="size-3" />
            Use code <span className="font-bold">{activeDiscount.code}</span> for {discountLabel}
          </div>
        )}
        <AddToCartButton
          product={{ id, name, price, image: images[0] ?? "", stock }}
        />
      </CardContent>
    </Card>
  );
}
