import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Star, Package, Truck, ShieldCheck, Tag } from "lucide-react";
import { getProductBySlug, getRelatedProducts, getActiveDiscountForProduct, getActiveDiscountsForProducts } from "@/services/products";
import { ProductImageGallery } from "@/components/products/product-image-gallery";
import { AddToCartButton } from "@/components/products/add-to-cart-button";
import { VariantPicker } from "@/components/products/variant-picker";
import { ProductCard } from "@/components/products/product-card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { TrackRecentlyViewed } from "@/components/products/track-recently-viewed";
import { getBaseUrl } from "@/lib/seo";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductBySlug(id);
  if (!product) return { title: "Product Not Found" };

  // Build description with facet values for SEO
  const facetParts = product.facetValues
    ?.map((pfv) => `${pfv.facetValue.facet.name}: ${pfv.facetValue.value}`)
    .join(", ");
  const desc = [product.description, facetParts].filter(Boolean).join(" | ");
  const description = desc || `Buy ${product.name} at the best price.`;
  const image = product.images[0] ?? undefined;

  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      url: `/products/${product.slug}`,
      type: "article",
      ...(image && { images: [image] }),
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      ...(image && { images: [image] }),
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id: slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const [relatedProducts, activeDiscount] = await Promise.all([
    getRelatedProducts(product.id, product.categoryId),
    getActiveDiscountForProduct(product.id),
  ]);

  // Fetch discounts for related products
  const relatedIds = relatedProducts.map((rp) => rp.id);
  const relatedDiscountMap = await getActiveDiscountsForProducts(relatedIds);

  const price = Number(product.price);

  const avgRating =
    product.reviews && product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
        product.reviews.length
      : 0;

  // Group facet values by facet name
  const facetGroups: Record<string, string[]> = {};
  if (product.facetValues) {
    for (const pfv of product.facetValues) {
      const facetName = pfv.facetValue.facet.name;
      if (!facetGroups[facetName]) facetGroups[facetName] = [];
      facetGroups[facetName].push(pfv.facetValue.value);
    }
  }

  // Prepare variants data for client component
  const hasVariants = product.variants && product.variants.length > 0;
  const variantsData = hasVariants
    ? product.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        price: Number(v.price),
        stock: v.stock,
        options: v.options.map((o) => ({
          facetId: o.facetValue.facet.id,
          facetName: o.facetValue.facet.name,
          facetValueId: o.facetValue.id,
          facetValue: o.facetValue.value,
        })),
      }))
    : [];

  // For products with variants, show price range
  const priceRange = hasVariants
    ? {
        min: Math.min(...variantsData.map((v) => v.price)),
        max: Math.max(...variantsData.map((v) => v.price)),
      }
    : null;

  // Total stock across variants
  const totalVariantStock = hasVariants
    ? variantsData.reduce((sum, v) => sum + v.stock, 0)
    : product.stock;

  // BreadcrumbList JSON-LD
  const baseUrl = getBaseUrl();
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Products", item: `${baseUrl}/products` },
      ...(product.category
        ? [{ "@type": "ListItem", position: 3, name: product.category.name, item: `${baseUrl}/products?category=${product.category.slug}` }]
        : []),
      { "@type": "ListItem", position: product.category ? 4 : 3, name: product.name },
    ],
  };

  // Product JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.sku,
    category: product.category?.name,
    offers: hasVariants
      ? {
          "@type": "AggregateOffer",
          lowPrice: priceRange!.min,
          highPrice: priceRange!.max,
          priceCurrency: "USD",
          offerCount: variantsData.length,
          availability:
            totalVariantStock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
        }
      : {
          "@type": "Offer",
          price: price,
          priceCurrency: "USD",
          availability:
            product.stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
        },
    ...(product.reviews &&
      product.reviews.length > 0 && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: avgRating.toFixed(1),
          reviewCount: product.reviews.length,
        },
      }),
    // Include facet values as additionalProperty for SEO
    ...(Object.keys(facetGroups).length > 0 && {
      additionalProperty: Object.entries(facetGroups).map(([name, values]) => ({
        "@type": "PropertyValue",
        name,
        value: values.join(", "),
      })),
    }),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <TrackRecentlyViewed slug={product.slug} />
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          href="/products"
          className="hover:text-foreground transition-colors"
        >
          Products
        </Link>
        {product.category && (
          <>
            <ChevronRight className="size-3.5" />
            <Link
              href={`/products?category=${product.category.slug}`}
              className="hover:text-foreground transition-colors"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="size-3.5" />
        <span className="text-foreground font-medium truncate max-w-[200px]">
          {product.name}
        </span>
      </nav>

      {/* Product main section */}
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Left — images */}
        <ProductImageGallery images={product.images} name={product.name} />

        {/* Right — info */}
        <div className="flex flex-col gap-6">
          {/* Category */}
          {product.category && (
            <Link
              href={`/products?category=${product.category.slug}`}
              className="w-fit"
            >
              <Badge variant="secondary">{product.category.name}</Badge>
            </Link>
          )}

          {/* Title */}
          <h1 className="text-3xl font-bold leading-tight lg:text-4xl">
            {product.name}
          </h1>

          {/* Rating */}
          {product.reviews && product.reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`size-4 ${
                      i < Math.round(avgRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {avgRating.toFixed(1)} ({product.reviews.length}{" "}
                {product.reviews.length === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3">
            {hasVariants && priceRange ? (
              priceRange.min === priceRange.max ? (
                <span className="text-3xl font-bold">
                  {formatPrice(priceRange.min)}
                </span>
              ) : (
                <span className="text-3xl font-bold">
                  {formatPrice(priceRange.min)} – {formatPrice(priceRange.max)}
                </span>
              )
            ) : (
              <span className="text-3xl font-bold">{formatPrice(price)}</span>
            )}
          </div>

          {/* Active discount banner */}
          {activeDiscount && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950/30">
              <Tag className="size-5 text-green-600 dark:text-green-400" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                  {activeDiscount.type === "PERCENTAGE"
                    ? `${activeDiscount.value}% OFF`
                    : `$${activeDiscount.value} OFF`}{" "}
                  with code{" "}
                  <span className="rounded bg-green-100 px-1.5 py-0.5 font-mono text-green-800 dark:bg-green-900 dark:text-green-300">
                    {activeDiscount.code}
                  </span>
                </p>
                <p className="text-xs text-green-600 dark:text-green-500">
                  Apply this code at checkout to get your discount
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <p className="leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          {/* Facet attributes (only show non-variant facets or when no variants) */}
          {!hasVariants && Object.keys(facetGroups).length > 0 && (
            <div className="space-y-3">
              {Object.entries(facetGroups).map(([facetName, values]) => (
                <div key={facetName} className="flex items-center gap-2">
                  <span className="text-sm font-medium">{facetName}:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {values.map((v) => (
                      <Badge key={v} variant="outline">
                        {v}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Variant picker or stock display + add to cart */}
          {hasVariants ? (
            <>
              <Separator />
              <VariantPicker
                product={{
                  id: product.id,
                  name: product.name,
                  price,
                  image: product.images[0] ?? "",
                }}
                variants={variantsData}
              />
            </>
          ) : (
            <>
              {/* Stock */}
              <div className="flex items-center gap-2 text-sm">
                {product.stock > 0 ? (
                  <>
                    <span className="size-2 rounded-full bg-green-500" />
                    <span className="text-green-600 dark:text-green-400">
                      In Stock
                    </span>
                    <span className="text-muted-foreground">
                      ({product.stock} available)
                    </span>
                  </>
                ) : (
                  <>
                    <span className="size-2 rounded-full bg-red-500" />
                    <span className="text-red-600 dark:text-red-400">
                      Out of Stock
                    </span>
                  </>
                )}
              </div>

              {/* SKU */}
              {product.sku && (
                <p className="text-sm text-muted-foreground">
                  SKU: <span className="font-mono">{product.sku}</span>
                </p>
              )}

              <Separator />

              {/* Add to cart */}
              <div className="max-w-xs">
                <AddToCartButton
                  product={{
                    id: product.id,
                    name: product.name,
                    price,
                    image: product.images[0] ?? "",
                    stock: product.stock,
                  }}
                />
              </div>
            </>
          )}

          <Separator />

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-4 text-center text-xs text-muted-foreground">
            <div className="flex flex-col items-center gap-1.5">
              <Truck className="size-5" />
              <span>Free Shipping</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <ShieldCheck className="size-5" />
              <span>Secure Payment</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Package className="size-5" />
              <span>Easy Returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews section */}
      {product.reviews && product.reviews.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold">Customer Reviews</h2>
          <div className="space-y-6">
            {product.reviews.map((review) => (
              <div key={review.id} className="rounded-lg border p-5">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {review.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {review.user?.name ?? "Anonymous"}
                      </p>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`size-3 ${
                              i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <time className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold">Related Products</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((rp) => (
              <ProductCard
                key={rp.id}
                id={rp.id}
                name={rp.name}
                slug={rp.slug}
                price={Number(rp.price)}
                images={rp.images}
                stock={rp.stock}
                category={rp.category}
                activeDiscount={relatedDiscountMap.get(rp.id) ?? null}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
