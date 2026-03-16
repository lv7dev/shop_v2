"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getRecentlyViewedSlugs } from "@/lib/recently-viewed";
import { ProductCard } from "@/components/products/product-card";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  stock: number;
  category: { name: string; slug: string } | null;
  hasVariants?: boolean;
};

export function RecentlyViewed() {
  const t = useTranslations("home");
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
      <h2 className="mb-8 text-2xl font-bold">{t("recentlyViewed")}</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {products.slice(0, 4).map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            slug={product.slug}
            price={product.price}
            images={product.images}
            stock={product.stock}
            category={product.category}
            hasVariants={product.hasVariants}
          />
        ))}
      </div>
    </section>
  );
}
