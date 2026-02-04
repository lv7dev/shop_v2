import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Detail",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Order Details</h1>
      <p className="text-muted-foreground">
        Order #{id} details will be displayed here.
      </p>
    </div>
  );
}
