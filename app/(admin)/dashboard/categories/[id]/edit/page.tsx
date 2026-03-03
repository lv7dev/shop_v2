import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminCategoryById, getCategoryOptions } from "@/services/categories";

const CategoryForm = dynamic(
  () => import("@/components/admin/category-form").then((mod) => mod.CategoryForm)
);

export const metadata: Metadata = {
  title: "Edit Category",
};

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [category, parentCategories] = await Promise.all([
    getAdminCategoryById(id),
    getCategoryOptions(),
  ]);

  if (!category) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <Link
          href="/dashboard/categories"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Categories
        </Link>
        <h1 className="text-3xl font-bold">Edit Category</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update the category details.
        </p>
      </div>

      <div className="rounded-lg border p-6">
        <CategoryForm
          category={{
            id: category.id,
            name: category.name,
            description: category.description,
            image: category.image,
            parentId: category.parentId,
          }}
          parentCategories={parentCategories}
        />
      </div>
    </div>
  );
}
