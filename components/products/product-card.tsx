import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "./add-to-cart-button";

type ProductCardProps = {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  images: string[];
  stock: number;
  category?: { name: string; slug: string } | null;
  priority?: boolean;
};

export function ProductCard({
  id,
  name,
  slug,
  price,
  comparePrice,
  images,
  stock,
  category,
  priority = false,
}: ProductCardProps) {
  const discount =
    comparePrice && comparePrice > price
      ? Math.round(((comparePrice - price) / comparePrice) * 100)
      : null;

  return (
    <Card className="group overflow-hidden py-0 transition-shadow hover:shadow-md">
      <Link href={`/products/${slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {images[0] ? (
            <Image
              src={images[0]}
              alt={name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform group-hover:scale-105"
              priority={priority}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <ShoppingCart className="size-12" />
            </div>
          )}
          {discount && (
            <Badge className="absolute left-2 top-2" variant="destructive">
              -{discount}%
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
          {comparePrice && comparePrice > price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(comparePrice)}
            </span>
          )}
        </div>
        <AddToCartButton
          product={{ id, name, price, image: images[0] ?? "", stock }}
        />
      </CardContent>
    </Card>
  );
}
