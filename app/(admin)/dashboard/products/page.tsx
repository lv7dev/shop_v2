import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Products",
};

export default function AdminProductsPage() {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Products</h1>
      </div>
      <div className="rounded-lg border p-6">
        <p className="text-muted-foreground">
          Product management table will be displayed here.
        </p>
      </div>
    </div>
  );
}
