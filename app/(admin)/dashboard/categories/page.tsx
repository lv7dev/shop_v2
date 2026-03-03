import type { Metadata } from "next";
import { Fragment } from "react";
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
import { getAdminCategories } from "@/services/categories";
import { DataTableSearch } from "@/components/admin/data-table-search";
import { DataTablePagination } from "@/components/admin/data-table-pagination";

const CategoryDeleteButton = dynamic(
  () => import("@/components/admin/category-actions").then((mod) => mod.CategoryDeleteButton)
);

export const metadata: Metadata = {
  title: "Manage Categories",
};

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const perPage = Math.max(1, Number(params.per_page) || 10);
  const search = params.q || undefined;

  const { data: categories, total } = await getAdminCategories({
    page,
    perPage,
    search,
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize your products into categories
          </p>
        </div>
        <Button asChild size="sm" className="gap-2">
          <Link href="/dashboard/categories/new">
            <Plus className="size-4" />
            Add Category
          </Link>
        </Button>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <DataTableSearch placeholder="Search categories..." />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">Products</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  No categories found.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <Fragment key={cat.id}>
                  <TableRow>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{cat.slug}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {cat._count.products}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="size-8" asChild>
                          <Link href={`/dashboard/categories/${cat.id}/edit`}>
                            <Pencil className="size-3.5" />
                          </Link>
                        </Button>
                        <CategoryDeleteButton categoryId={cat.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                  {cat.children?.map((child) => (
                    <TableRow key={child.id}>
                      <TableCell className="pl-8 text-muted-foreground">
                        — {child.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{child.slug}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {child._count.products}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="size-8" asChild>
                            <Link href={`/dashboard/categories/${child.id}/edit`}>
                              <Pencil className="size-3.5" />
                            </Link>
                          </Button>
                          <CategoryDeleteButton categoryId={child.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
        <DataTablePagination total={total} page={page} perPage={perPage} />
      </div>
    </div>
  );
}
