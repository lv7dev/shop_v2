import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Orders",
};

export default function AdminOrdersPage() {
  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Orders</h1>
      <div className="rounded-lg border p-6">
        <p className="text-muted-foreground">
          Order management table will be displayed here.
        </p>
      </div>
    </div>
  );
}
