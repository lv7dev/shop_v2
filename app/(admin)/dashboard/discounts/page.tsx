import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminDiscounts } from "@/services/admin";
import { formatPrice } from "@/lib/utils";
import { DataTableSearch } from "@/components/admin/data-table-search";
import { DataTableFilter } from "@/components/admin/data-table-filter";
import { DataTablePagination } from "@/components/admin/data-table-pagination";

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

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Expired", value: "expired" },
  { label: "Scheduled", value: "scheduled" },
];

export default async function AdminDiscountsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const perPage = Math.max(1, Number(params.per_page) || 10);
  const search = params.q || undefined;
  const status = params.status || undefined;

  const { data: discounts, total } = await getAdminDiscounts({
    page,
    perPage,
    search,
    status,
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Discounts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage discount codes
          </p>
        </div>
        <Button asChild size="sm" className="gap-2">
          <Link href="/dashboard/discounts/new">
            <Plus className="size-4" />
            Add Discount
          </Link>
        </Button>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <DataTableSearch placeholder="Search by code..." />
        <DataTableFilter paramKey="status" options={STATUS_OPTIONS} placeholder="Status" />
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
                  No discounts found.
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
                        <Button variant="ghost" size="icon" className="size-8" asChild>
                          <Link href={`/dashboard/discounts/${d.id}/edit`}>
                            <Pencil className="size-3.5" />
                          </Link>
                        </Button>
                        <DiscountDeleteButton discountId={d.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <DataTablePagination total={total} page={page} perPage={perPage} />
      </div>
    </div>
  );
}
