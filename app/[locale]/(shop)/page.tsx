import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProducts, getActiveDiscountsForProducts } from "@/services/products";
import { getCategories } from "@/services/categories";
import { ProductCard } from "@/components/products/product-card";
import { BenefitsCarousel } from "@/components/home/benefits-carousel";
import { RecentlyViewed } from "@/components/home/recently-viewed";
import { APP_NAME } from "@/lib/constants";
import { buildPageMetadata } from "@/lib/seo";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = buildPageMetadata({
  title: `${APP_NAME} — Discover Quality Products`,
  description:
    "Browse our curated collection of premium products. Find exactly what you need at the best prices with free shipping on orders over 1,000,000 VND.",
  path: "/",
});

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const [{ products }, categories] = await Promise.all([
    getProducts({ limit: 8 }),
    getCategories(),
  ]);

  // Fetch active discounts for featured products
  const productIds = products.map((p) => p.id);
  const discountMap = await getActiveDiscountsForProducts(productIds);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djJoLTJ2LTJoMnptMC00aDJ2Mmgt MnYtMnptLTQgMHYyaC0ydi0yaDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-center gap-6 px-4 py-24 text-center sm:py-32">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-sm backdrop-blur-sm">
            <Sparkles className="size-4 text-primary" />
            <span>{t("home.heroTag")}</span>
          </div>
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            {t("home.heroTitle")}{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t("home.heroTitleHighlight")}
            </span>
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
            {t("home.heroDescription", { threshold: formatPrice(1_000_000, locale) })}
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button size="lg" className="gap-2 text-base" asChild>
              <Link href="/products">
                {t("home.shopNow")} <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base" asChild>
              <Link href="/categories">{t("home.browseCategories")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Carousel */}
      <BenefitsCarousel />

      {/* Category Quick Links */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="mb-8 text-2xl font-bold">{t("home.shopByCategory")}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center transition-all hover:border-primary/50 hover:shadow-md"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <span className="text-lg font-bold">{cat.name.charAt(0)}</span>
                </div>
                <span className="text-sm font-medium">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="bg-muted/20 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold">{t("home.featuredProducts")}</h2>
            <Button variant="outline" className="gap-2" asChild>
              <Link href="/products">
                {t("common.viewAll")} <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          {products.length > 0 ? (
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
                  hasVariants={(product._count?.variants ?? 0) > 0}
                />
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-muted-foreground">
              {t("home.noProducts")}
            </p>
          )}
        </div>
      </section>

      {/* Recently Viewed */}
      <RecentlyViewed />
    </div>
  );
}
