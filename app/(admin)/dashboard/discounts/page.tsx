import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminDiscounts } from "@/services/admin";
import { getAdminProducts } from "@/services/admin";
import { formatPrice } from "@/lib/utils";

const DiscountForm = dynamic(
  () =>
    import("@/components/admin/discount-form").then((mod) => mod.DiscountForm)
);
const DiscountEditButton = dynamic(
  () =>
    import("@/components/admin/discount-form").then(
      (mod) => mod.DiscountEditButton
    )
);
const DiscountDeleteButton = dynamic(
  () =>
    import("@/components/admin/discount-actions").then(
      (mod) => mod.DiscountDeleteButton
    )
);
const DiscountToggleButton = dynamic(
  () =>
    import("@/components/admin/discount-actions").then(
      (mod) => mod.DiscountToggleButton
    )
);

export const metadata: Metadata = {
  title: "Manage Discounts",
};

export default async function AdminDiscountsPage() {
  const [discounts, products] = await Promise.all([
    getAdminDiscounts(),
    getAdminProducts(),
  ]);

  const productOptions = products.map((p) => ({ id: p.id, name: p.name }));

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Discounts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage discount codes
          </p>
        </div>
        <DiscountForm products={productOptions} />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-center">Usage</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {discounts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-8 text-center text-muted-foreground"
                >
                  No discounts yet. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              discounts.map((d) => {
                const now = new Date();
                const isExpired = d.expiresAt && d.expiresAt < now;
                const isNotStarted = d.startsAt > now;

                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono font-medium">
                      {d.code}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {d.type === "PERCENTAGE" ? "Percent" : "Fixed"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {d.type === "PERCENTAGE"
                        ? `${Number(d.value)}%`
                        : formatPrice(Number(d.value))}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {d.scope === "ORDER"
                          ? "Order"
                          : `${d.products.length} product${d.products.length !== 1 ? "s" : ""}`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Badge variant={d.method === "AUTO" ? "default" : "outline"}>
                          {d.method === "AUTO" ? "Auto" : "Code"}
                        </Badge>
                        {d.stackable && (
                          <Badge variant="secondary" className="text-[10px]">
                            Stack
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {d.usedCount}
                      {d.maxUses ? `/${d.maxUses}` : ""}
                    </TableCell>
                    <TableCell className="text-center">
                      {isExpired ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : isNotStarted ? (
                        <Badge variant="outline">Scheduled</Badge>
                      ) : d.isActive ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <DiscountToggleButton
                          discountId={d.id}
                          isActive={d.isActive}
                        />
                        <DiscountEditButton
                          discount={{
                            id: d.id,
                            code: d.code,
                            description: d.description,
                            type: d.type,
                            scope: d.scope,
                            method: d.method,
                            stackable: d.stackable,
                            value: Number(d.value),
                            minOrder: d.minOrder ? Number(d.minOrder) : null,
                            maxUses: d.maxUses,
                            isActive: d.isActive,
                            startsAt: d.startsAt.toISOString(),
                            expiresAt: d.expiresAt
                              ? d.expiresAt.toISOString()
                              : null,
                            productIds: d.products.map((p) => p.productId),
                          }}
                          products={productOptions}
                        />
                        <DiscountDeleteButton discountId={d.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
