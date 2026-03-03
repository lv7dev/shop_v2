import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProductOptions } from "@/services/admin";

const DiscountForm = dynamic(
  () => import("@/components/admin/discount-form").then((mod) => mod.DiscountForm)
);

export const metadata: Metadata = {
  title: "Create Discount",
};

export default async function NewDiscountPage() {
  const products = await getProductOptions();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <Link
          href="/dashboard/discounts"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Discounts
        </Link>
        <h1 className="text-3xl font-bold">Create Discount</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a new discount code. Users will be notified automatically.
        </p>
      </div>

      <div className="rounded-lg border p-6">
        <DiscountForm products={products} />
      </div>
    </div>
  );
}
