import type { Metadata } from "next";
import { Fragment } from "react";
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
import { getCategories } from "@/services/categories";

const CategoryForm = dynamic(
  () => import("@/components/admin/category-form").then((mod) => mod.CategoryForm)
);
const CategoryEditButton = dynamic(
  () => import("@/components/admin/category-form").then((mod) => mod.CategoryEditButton)
);
const CategoryDeleteButton = dynamic(
  () => import("@/components/admin/category-actions").then((mod) => mod.CategoryDeleteButton)
);

export const metadata: Metadata = {
  title: "Manage Categories",
};

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  // Flatten for parent options (only top-level can be parents)
  const parentOptions = categories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize your products into categories
          </p>
        </div>
        <CategoryForm parentCategories={parentOptions} />
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
                  No categories yet. Create one to get started.
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
                        <CategoryEditButton
                          category={cat}
                          parentCategories={parentOptions}
                        />
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
                          <CategoryEditButton
                            category={child}
                            parentCategories={parentOptions}
                          />
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
      </div>
    </div>
  );
}
