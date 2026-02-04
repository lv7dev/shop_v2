import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products",
};

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">All Products</h1>

      <div className="flex gap-8">
        {/* Filters sidebar placeholder */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="space-y-4">
            <div className="h-48 rounded-lg border bg-muted/50" />
            <div className="h-32 rounded-lg border bg-muted/50" />
          </div>
        </aside>

        {/* Product grid placeholder */}
        <div className="flex-1">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-72 rounded-lg border bg-muted/50 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
