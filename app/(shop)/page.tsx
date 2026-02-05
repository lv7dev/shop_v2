import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getProducts } from "@/services/products";
import { ProductCard } from "@/components/products/product-card";

export default async function HomePage() {
  const { products } = await getProducts({ limit: 4 });

  return (
    <div>
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center gap-6 px-4 py-24 text-center">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Discover Quality Products
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Browse our curated collection of products. Find exactly what you need
          at the best prices.
        </p>
        <div className="flex gap-4">
          <Button size="lg" asChild>
            <Link href="/products">Shop Now</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/products">Browse Categories</Link>
          </Button>
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Featured Products</h2>
          <Button variant="outline" asChild>
            <Link href="/products">View All</Link>
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
                comparePrice={
                  product.comparePrice ? Number(product.comparePrice) : null
                }
                images={product.images}
                stock={product.stock}
                category={product.category}
                priority={i < 4}
              />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-muted-foreground">
            No products available yet.
          </p>
        )}
      </section>
    </div>
  );
}
