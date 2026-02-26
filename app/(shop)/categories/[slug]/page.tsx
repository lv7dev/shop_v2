import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Package } from "lucide-react";
import { getCategoryBySlug } from "@/services/categories";
import { getProducts, getActiveDiscountsForProducts } from "@/services/products";
import { ProductCard } from "@/components/products/product-card";
import { Pagination } from "@/components/products/pagination";
import { Badge } from "@/components/ui/badge";
import { ITEMS_PER_PAGE } from "@/lib/constants";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category Not Found" };

  const description = category.description ?? `Browse products in ${category.name}`;

  return {
    title: category.name,
    description,
    alternates: { canonical: `/categories/${slug}` },
    openGraph: {
      title: category.name,
      description,
      url: `/categories/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: category.name,
      description,
    },
  };
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Number(sp.page) || 1;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const { products, totalPages, currentPage, total } = await getProducts({
    categorySlug: slug,
    page,
    limit: ITEMS_PER_PAGE,
  });

  // Fetch active discounts for products in this category
  const productIds = products.map((p) => p.id);
  const discountMap = await getActiveDiscountsForProducts(productIds);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          href="/categories"
          className="hover:text-foreground transition-colors"
        >
          Categories
        </Link>
        {category.parent && (
          <>
            <ChevronRight className="size-3.5" />
            <Link
              href={`/categories/${category.parent.slug}`}
              className="hover:text-foreground transition-colors"
            >
              {category.parent.name}
            </Link>
          </>
        )}
        <ChevronRight className="size-3.5" />
        <span className="text-foreground font-medium">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{category.name}</h1>
        {category.description && (
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {category.description}
          </p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          {total} {total === 1 ? "product" : "products"}
        </p>
      </div>

      {/* Subcategories */}
      {category.children && category.children.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {category.children.map((child) => (
            <Link key={child.id} href={`/categories/${child.slug}`}>
              <Badge
                variant="outline"
                className="cursor-pointer px-3 py-1.5 text-sm transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                {child.name}
                <span className="ml-1 text-muted-foreground">
                  ({child._count.products})
                </span>
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {/* Products */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <Package className="size-16 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold">No products yet</h2>
            <p className="text-sm text-muted-foreground">
              This category doesn&apos;t have any products yet.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product, i) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                slug={product.slug}
                price={Number(product.price)}
                images={product.images}
                stock={product.stock}
                category={product.category}
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority={i < 4}
                activeDiscount={discountMap.get(product.id) ?? null}
              />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath={`/categories/${slug}`}
            searchParams={{}}
          />
        </>
      )}
    </div>
  );
}
