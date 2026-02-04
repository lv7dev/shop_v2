import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orders",
};

export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">My Orders</h1>
      <p className="text-muted-foreground">You have no orders yet.</p>
    </div>
  );
}
