import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Star, Package, Truck, ShieldCheck } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/services/products";
import { ProductImageGallery } from "@/components/products/product-image-gallery";
import { AddToCartButton } from "@/components/products/add-to-cart-button";
import { ProductCard } from "@/components/products/product-card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductBySlug(id);
  if (!product) return { title: "Product Not Found" };
  return {
    title: product.name,
    description: product.description ?? undefined,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id: slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const relatedProducts = await getRelatedProducts(
    product.id,
    product.categoryId
  );

  const price = Number(product.price);
  const comparePrice = product.comparePrice
    ? Number(product.comparePrice)
    : null;
  const discount =
    comparePrice && comparePrice > price
      ? Math.round(((comparePrice - price) / comparePrice) * 100)
      : null;

  const avgRating =
    product.reviews && product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
        product.reviews.length
      : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
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
            <span className="text-3xl font-bold">{formatPrice(price)}</span>
            {comparePrice && comparePrice > price && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(comparePrice)}
                </span>
                <Badge variant="destructive">-{discount}%</Badge>
              </>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

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
                comparePrice={
                  rp.comparePrice ? Number(rp.comparePrice) : null
                }
                images={rp.images}
                stock={rp.stock}
                category={rp.category}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
