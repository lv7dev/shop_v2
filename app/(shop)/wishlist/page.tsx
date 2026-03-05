import type { Metadata } from "next";
import { WishlistPageContent } from "@/components/wishlist/wishlist-page-content";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "My Wishlist",
  description:
    "View your saved products and move them to your cart when you're ready to buy.",
  path: "/wishlist",
  noIndex: true,
});

export default function WishlistPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <WishlistPageContent />
    </div>
  );
}
