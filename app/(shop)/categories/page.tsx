import type { Metadata } from "next";
import Link from "next/link";
import { FolderOpen, ChevronRight, Package } from "lucide-react";
import { getCategories } from "@/services/categories";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Categories",
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Shop by Category</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse our {categories.length} top-level{" "}
          {categories.length === 1 ? "category" : "categories"}
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <FolderOpen className="size-16 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold">No categories yet</h2>
            <p className="text-sm text-muted-foreground">
              Check back soon for new product categories.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const totalProducts =
              category._count.products +
              (category.children?.reduce(
                (sum, child) => sum + child._count.products,
                0
              ) ?? 0);

            return (
              <Link key={category.id} href={`/categories/${category.slug}`}>
                <Card className="group h-full py-0 transition-all hover:shadow-md hover:border-primary/30">
                  <CardContent className="flex flex-col gap-4 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <Package className="size-6" />
                      </div>
                      <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
                        {category.name}
                      </h2>
                      {category.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {category.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">
                        {totalProducts} {totalProducts === 1 ? "product" : "products"}
                      </Badge>
                      {category.children && category.children.length > 0 && (
                        <Badge variant="outline">
                          {category.children.length}{" "}
                          {category.children.length === 1
                            ? "subcategory"
                            : "subcategories"}
                        </Badge>
                      )}
                    </div>

                    {category.children && category.children.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 border-t pt-3">
                        {category.children.map((child) => (
                          <span
                            key={child.id}
                            className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {child.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
