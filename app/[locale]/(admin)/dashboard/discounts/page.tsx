import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Link } from "@/i18n/routing";
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
import { getTranslations, setRequestLocale } from "next-intl/server";

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

export default async function AdminDiscountsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.discounts");

  const STATUS_OPTIONS = [
    { label: t("active"), value: "active" },
    { label: t("inactive"), value: "inactive" },
    { label: t("expired"), value: "expired" },
    { label: t("scheduled"), value: "scheduled" },
  ];

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const perPage = Math.max(1, Number(sp.per_page) || 10);
  const search = sp.q || undefined;
  const status = sp.status || undefined;

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
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <Button asChild size="sm" className="gap-2">
          <Link href="/dashboard/discounts/new">
            <Plus className="size-4" />
            {t("addDiscount")}
          </Link>
        </Button>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <DataTableSearch placeholder={t("searchPlaceholder")} />
        <DataTableFilter paramKey="status" options={STATUS_OPTIONS} placeholder="Status" />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("thCode")}</TableHead>
              <TableHead>{t("thType")}</TableHead>
              <TableHead>{t("thValue")}</TableHead>
              <TableHead>{t("thScope")}</TableHead>
              <TableHead>{t("thMethod")}</TableHead>
              <TableHead className="text-center">{t("thUsage")}</TableHead>
              <TableHead className="text-center">{t("thStatus")}</TableHead>
              <TableHead className="w-32 text-right">{t("thActions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {discounts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-8 text-center text-muted-foreground"
                >
                  {t("noDiscounts")}
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
                        {d.type === "PERCENTAGE" ? t("percent") : t("fixed")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {d.type === "PERCENTAGE"
                        ? `${Number(d.value)}%`
                        : formatPrice(Number(d.value), locale)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {d.scope === "ORDER"
                          ? t("scopeOrder")
                          : t("scopeProducts", { count: d.products.length })}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Badge variant={d.method === "AUTO" ? "default" : "outline"}>
                          {d.method === "AUTO" ? t("methodAuto") : t("methodCode")}
                        </Badge>
                        {d.stackable && (
                          <Badge variant="secondary" className="text-[10px]">
                            {t("stackable")}
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
                        <Badge variant="destructive">{t("expired")}</Badge>
                      ) : isNotStarted ? (
                        <Badge variant="outline">{t("scheduled")}</Badge>
                      ) : d.isActive ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          {t("active")}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{t("inactive")}</Badge>
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
