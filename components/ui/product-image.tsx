"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { ShoppingCart } from "lucide-react";

type ProductImageProps = Omit<ImageProps, "onError"> & {
  fallbackClassName?: string;
};

export function ProductImage({
  fallbackClassName,
  alt,
  ...props
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={
          fallbackClassName ??
          "flex h-full w-full items-center justify-center bg-muted text-muted-foreground"
        }
      >
        <ShoppingCart className="size-12" />
      </div>
    );
  }

  return (
    <Image
      alt={alt}
      {...props}
      onError={() => setHasError(true)}
    />
  );
}
