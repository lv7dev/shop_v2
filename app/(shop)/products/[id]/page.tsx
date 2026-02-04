import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product Detail",
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Image placeholder */}
        <div className="aspect-square rounded-lg border bg-muted/50" />

        {/* Product info placeholder */}
        <div className="space-y-4">
          <div className="h-8 w-3/4 rounded bg-muted/50" />
          <div className="h-6 w-1/4 rounded bg-muted/50" />
          <div className="h-24 rounded bg-muted/50" />
          <div className="h-12 w-1/3 rounded bg-muted/50" />
        </div>
      </div>
    </div>
  );
}
