import type { Metadata } from "next";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getProducts, getActiveDiscountsForProducts } from "@/services/products";
import { getCategories } from "@/services/categories";
import { getFilterableFacets } from "@/services/facets";
import { Pagination } from "@/components/products/pagination";
import { LoadMoreProducts } from "@/components/products/load-more-products";
import { ITEMS_PER_PAGE, PER_PAGE_OPTIONS } from "@/lib/constants";
import { ProductSort } from "@/components/products/product-sort";
import { Package } from "lucide-react";

const ProductFilters = dynamic(
  () => import("@/components/products/product-filters").then((mod) => mod.ProductFilters),
  {
    loading: () => <div className="hidden w-64 shrink-0 lg:block"><div className="h-96 animate-pulse rounded-lg bg-muted" /></div>,
  }
);

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Known non-facet params
const RESERVED_PARAMS = new Set(["category", "search", "page", "minPrice", "maxPrice", "perPage", "sort"]);

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

export default async function ProductsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const categorySlug = typeof sp.category === "string" ? sp.category : undefined;
  const search = typeof sp.search === "string" ? sp.search : undefined;
  const facets = parseFacetParams(sp);

  const minPrice = typeof sp.minPrice === "string" && sp.minPrice ? Number(sp.minPrice) : undefined;
  const maxPrice = typeof sp.maxPrice === "string" && sp.maxPrice ? Number(sp.maxPrice) : undefined;
  const perPage = typeof sp.perPage === "string" && PER_PAGE_OPTIONS.includes(Number(sp.perPage))
    ? Number(sp.perPage)
    : ITEMS_PER_PAGE;
  const sort = typeof sp.sort === "string" ? sp.sort : undefined;

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
        sort,
      }),
      getCategories(),
      getFilterableFacets({ categorySlug, search, activeFacets: facets }),
    ]);

  // Fetch active discounts for the displayed products
  const productIds = products.map((p) => p.id);
  const discountMap = await getActiveDiscountsForProducts(productIds);

  // Build searchParams for pagination (include facet params)
  const paginationParams: Record<string, string | undefined> = {
    category: categorySlug,
    search,
    minPrice: minPrice !== undefined ? String(minPrice) : undefined,
    maxPrice: maxPrice !== undefined ? String(maxPrice) : undefined,
    perPage: perPage !== ITEMS_PER_PAGE ? String(perPage) : undefined,
    sort,
  };
  for (const [key, values] of Object.entries(facets)) {
    paginationParams[key] = values.join(",");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("product.allProducts")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("product.productsFound", { count: total })}
          </p>
        </div>
        <Suspense>
          <ProductSort />
        </Suspense>
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
                <h2 className="text-lg font-semibold">{t("product.noProductsFound")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("product.adjustFilters")}
                </p>
              </div>
            </div>
          ) : (
            <>
              <LoadMoreProducts
                key={`${sort ?? "newest"}-${categorySlug}-${search}-${minPrice}-${maxPrice}-${JSON.stringify(facets)}`}
                initialProducts={products.map((p) => {
                  const cat = (p as typeof p & { category: { name: string; slug: string } | null }).category;
                  const counts = (p as typeof p & { _count: { variants: number } })._count;
                  return {
                    id: p.id,
                    name: p.name,
                    slug: p.slug,
                    price: Number(p.price),
                    images: p.images,
                    stock: p.stock,
                    category: cat ? { name: cat.name, slug: cat.slug } : null,
                    activeDiscount: discountMap.get(p.id) ?? null,
                    hasVariants: (counts?.variants ?? 0) > 0,
                  };
                })}
                total={total}
                perPage={perPage}
                totalPages={totalPages}
                filterParams={{
                  categorySlug,
                  search,
                  facets: Object.keys(facets).length > 0 ? facets : undefined,
                  minPrice,
                  maxPrice,
                  sort,
                }}
              />
              <noscript>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  basePath="/products"
                  searchParams={paginationParams}
                />
              </noscript>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
