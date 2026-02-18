"use client";

import { useEffect, useState } from "react";
import { getRecentlyViewedSlugs } from "@/lib/recently-viewed";
import { ProductCard } from "@/components/products/product-card";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  images: string[];
  stock: number;
  category: { name: string; slug: string } | null;
};

export function RecentlyViewed() {
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    const slugs = getRecentlyViewedSlugs();
    if (slugs.length === 0) return;

    let cancelled = false;
    fetch(`/api/products/by-slugs?slugs=${slugs.join(",")}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setProducts(data.products ?? []);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!products || products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <h2 className="mb-8 text-2xl font-bold">Recently Viewed</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {products.slice(0, 4).map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            slug={product.slug}
            price={product.price}
            comparePrice={product.comparePrice}
            images={product.images}
            stock={product.stock}
            category={product.category}
          />
        ))}
      </div>
    </section>
  );
}
