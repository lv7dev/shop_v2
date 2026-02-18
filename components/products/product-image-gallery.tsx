"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { ProductImage } from "@/components/ui/product-image";
import { cn } from "@/lib/utils";

type ProductImageGalleryProps = {
  images: string[];
  name: string;
};

export function ProductImageGallery({ images, name }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg border bg-muted">
        <ShoppingCart className="size-16 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
        <ProductImage
          src={images[selectedIndex]}
          alt={`${name} — image ${selectedIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3">
          {images.map((image, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={cn(
                "relative size-20 shrink-0 overflow-hidden rounded-md border-2 bg-muted transition-colors",
                i === selectedIndex
                  ? "border-primary"
                  : "border-transparent hover:border-muted-foreground/40"
              )}
            >
              <ProductImage
                src={image}
                alt={`${name} — thumbnail ${i + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
