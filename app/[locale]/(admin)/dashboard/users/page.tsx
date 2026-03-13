import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminUsers } from "@/services/admin";
import { DataTableSearch } from "@/components/admin/data-table-search";
import { DataTableFilter } from "@/components/admin/data-table-filter";
import { DataTablePagination } from "@/components/admin/data-table-pagination";

export const metadata: Metadata = {
  title: "Manage Users",
};

export default async function AdminUsersPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await routeParams;
  setRequestLocale(locale);
  const t = await getTranslations("admin.users");

  const ROLE_OPTIONS = [
    { label: t("roleAdmin"), value: "ADMIN" },
    { label: t("roleCustomer"), value: "CUSTOMER" },
  ];

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const perPage = Math.max(1, Number(params.per_page) || 10);
  const search = params.q || undefined;
  const role = params.role || undefined;

  const { data: users, total } = await getAdminUsers({
    page,
    perPage,
    search,
    role,
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <span className="text-sm text-muted-foreground">
          {t("count", { count: total })}
        </span>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <DataTableSearch placeholder={t("searchPlaceholder")} />
        <DataTableFilter paramKey="role" options={ROLE_OPTIONS} placeholder="Role" />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("thUser")}</TableHead>
              <TableHead>{t("thRole")}</TableHead>
              <TableHead className="text-right">{t("thOrders")}</TableHead>
              <TableHead className="text-right">{t("thReviews")}</TableHead>
              <TableHead>{t("thJoined")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  {t("noUsers")}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="text-xs">
                          {(user.name ?? user.email)
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name || "—"}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "ADMIN" ? "default" : "secondary"}
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {user._count.orders}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {user._count.reviews}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString(locale, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <DataTablePagination total={total} page={page} perPage={perPage} />
      </div>
    </div>
  );
}
