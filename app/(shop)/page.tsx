import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
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

      {/* Featured section placeholder */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="mb-8 text-2xl font-bold">Featured Products</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-72 rounded-lg border bg-muted/50 animate-pulse"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
