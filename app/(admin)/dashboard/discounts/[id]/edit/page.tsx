import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminDiscountById, getProductOptions } from "@/services/admin";

const DiscountForm = dynamic(
  () => import("@/components/admin/discount-form").then((mod) => mod.DiscountForm)
);

export const metadata: Metadata = {
  title: "Edit Discount",
};

export default async function EditDiscountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [discount, products] = await Promise.all([
    getAdminDiscountById(id),
    getProductOptions(),
  ]);

  if (!discount) notFound();

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
        <h1 className="text-3xl font-bold">Edit Discount</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update the discount details.
        </p>
      </div>

      <div className="rounded-lg border p-6">
        <DiscountForm
          discount={{
            id: discount.id,
            code: discount.code,
            description: discount.description,
            type: discount.type,
            scope: discount.scope,
            method: discount.method,
            stackable: discount.stackable,
            value: Number(discount.value),
            minOrder: discount.minOrder ? Number(discount.minOrder) : null,
            maxUses: discount.maxUses,
            isActive: discount.isActive,
            startsAt: discount.startsAt.toISOString(),
            expiresAt: discount.expiresAt
              ? discount.expiresAt.toISOString()
              : null,
            productIds: discount.products.map((p) => p.productId),
          }}
          products={products}
        />
      </div>
    </div>
  );
}
