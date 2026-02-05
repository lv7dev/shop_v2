import type { Metadata } from "next";
import { Suspense } from "react";
import { getProducts } from "@/services/products";
import { getCategories } from "@/services/categories";
import { ProductCard } from "@/components/products/product-card";
import { ProductFilters } from "@/components/products/product-filters";
import { Pagination } from "@/components/products/pagination";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { Package } from "lucide-react";

export const metadata: Metadata = {
  title: "Products",
};

type Props = {
  searchParams: Promise<{
    category?: string;
    search?: string;
    page?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const [{ products, totalPages, currentPage, total }, categories] =
    await Promise.all([
      getProducts({
        categorySlug: params.category,
        search: params.search,
        page,
        limit: ITEMS_PER_PAGE,
      }),
      getCategories(),
    ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold">All Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} {total === 1 ? "product" : "products"} found
          </p>
        </div>
      </div>

      <div className="lg:flex lg:gap-8">
        <Suspense>
          <ProductFilters categories={categories} />
        </Suspense>

        <div className="flex-1">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
              <Package className="size-16 text-muted-foreground" />
              <div>
                <h2 className="text-lg font-semibold">No products found</h2>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product, i) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    slug={product.slug}
                    price={Number(product.price)}
                    comparePrice={
                      product.comparePrice ? Number(product.comparePrice) : null
                    }
                    images={product.images}
                    stock={product.stock}
                    category={product.category}
                    priority={i < 3}
                  />
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                basePath="/products"
                searchParams={{
                  category: params.category,
                  search: params.search,
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
