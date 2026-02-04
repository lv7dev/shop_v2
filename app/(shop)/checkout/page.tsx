import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout",
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Checkout</h1>

      <div className="space-y-6">
        {/* Shipping address placeholder */}
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">Shipping Address</h2>
          <p className="text-sm text-muted-foreground">
            Checkout form will be implemented here.
          </p>
        </div>

        {/* Payment placeholder */}
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">Payment Method</h2>
          <p className="text-sm text-muted-foreground">
            Payment integration will be added here.
          </p>
        </div>
      </div>
    </div>
  );
}
