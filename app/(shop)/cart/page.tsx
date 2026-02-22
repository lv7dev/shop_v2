import type { Metadata } from "next";
import { CartContent } from "@/components/cart/cart-content";

export const metadata: Metadata = {
  title: "Cart",
  description: "View and manage the items in your shopping cart.",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Shopping Cart</h1>
      <CartContent />
    </div>
  );
}
