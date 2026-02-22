import type { Metadata } from "next";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { getProducts } from "@/services/products";
import { getCategories } from "@/services/categories";
import { getFilterableFacets } from "@/services/facets";
import { ProductCard } from "@/components/products/product-card";
import { Pagination } from "@/components/products/pagination";
import { ITEMS_PER_PAGE, PER_PAGE_OPTIONS } from "@/lib/constants";
import { Package } from "lucide-react";

const ProductFilters = dynamic(
  () => import("@/components/products/product-filters").then((mod) => mod.ProductFilters),
  {
    loading: () => <div className="hidden w-64 shrink-0 lg:block"><div className="h-96 animate-pulse rounded-lg bg-muted" /></div>,
  }
);

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Known non-facet params
const RESERVED_PARAMS = new Set(["category", "search", "page", "minPrice", "maxPrice", "perPage"]);

function parseFacetParams(
  params: Record<string, string | string[] | undefined>
): Record<string, string[]> {
  const facets: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(params)) {
    if (RESERVED_PARAMS.has(key) || !value) continue;
    const values = typeof value === "string" ? value.split(",") : value;
    if (values.length > 0) {
      facets[key] = values;
    }
  }
  return facets;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : undefined;
  const facets = parseFacetParams(params);

  const parts: string[] = [];
  if (category) parts.push(category.replace(/-/g, " "));
  for (const [key, values] of Object.entries(facets)) {
    parts.push(`${key}: ${values.join(", ")}`);
  }

  const suffix = parts.length > 0 ? ` - ${parts.join(" | ")}` : "";

  const title = `Products${suffix}`;
  const description = `Browse our products${suffix}. Find exactly what you need with our faceted filters.`;

  return {
    title,
    description,
    alternates: { canonical: "/products" },
    openGraph: { title, description, url: "/products" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const categorySlug = typeof params.category === "string" ? params.category : undefined;
  const search = typeof params.search === "string" ? params.search : undefined;
  const facets = parseFacetParams(params);

  const minPrice = typeof params.minPrice === "string" && params.minPrice ? Number(params.minPrice) : undefined;
  const maxPrice = typeof params.maxPrice === "string" && params.maxPrice ? Number(params.maxPrice) : undefined;
  const perPage = typeof params.perPage === "string" && PER_PAGE_OPTIONS.includes(Number(params.perPage))
    ? Number(params.perPage)
    : ITEMS_PER_PAGE;

  const [{ products, totalPages, currentPage, total }, categories, filterableFacets] =
    await Promise.all([
      getProducts({
        categorySlug,
        search,
        facets: Object.keys(facets).length > 0 ? facets : undefined,
        minPrice,
        maxPrice,
        page,
        limit: perPage,
      }),
      getCategories(),
      getFilterableFacets({ categorySlug, search, activeFacets: facets }),
    ]);

  // Build searchParams for pagination (include facet params)
  const paginationParams: Record<string, string | undefined> = {
    category: categorySlug,
    search,
    minPrice: minPrice !== undefined ? String(minPrice) : undefined,
    maxPrice: maxPrice !== undefined ? String(maxPrice) : undefined,
    perPage: perPage !== ITEMS_PER_PAGE ? String(perPage) : undefined,
  };
  for (const [key, values] of Object.entries(facets)) {
    paginationParams[key] = values.join(",");
  }

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
          <ProductFilters
            categories={categories}
            facets={filterableFacets}
          />
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
                searchParams={paginationParams}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
