"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "./product-card";
import { loadMoreProducts } from "@/actions/products";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  stock: number;
  category: { name: string; slug: string } | null;
  activeDiscount: {
    code: string;
    type: "PERCENTAGE" | "FIXED";
    value: number;
  } | null;
};

type Props = {
  initialProducts: Product[];
  total: number;
  perPage: number;
  totalPages: number;
  filterParams: {
    categorySlug?: string;
    search?: string;
    facets?: Record<string, string[]>;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
  };
};

export function LoadMoreProducts({
  initialProducts,
  total,
  perPage,
  totalPages,
  filterParams,
}: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(totalPages > 1);
  const [isPending, startTransition] = useTransition();

  function handleLoadMore() {
    const nextPage = page + 1;
    startTransition(async () => {
      const result = await loadMoreProducts({
        page: nextPage,
        limit: perPage,
        ...filterParams,
      });
      setProducts((prev) => [...prev, ...result.products]);
      setPage(nextPage);
      setHasMore(result.hasMore);
    });
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product, i) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            slug={product.slug}
            price={product.price}
            images={product.images}
            stock={product.stock}
            category={product.category}
            priority={i < 3}
            activeDiscount={product.activeDiscount}
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-3 pt-8">
        <p className="text-sm text-muted-foreground">
          Showing {products.length} of {total} products
        </p>
        {hasMore && (
          <Button
            variant="outline"
            size="lg"
            onClick={handleLoadMore}
            disabled={isPending}
            className="min-w-[200px]"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
