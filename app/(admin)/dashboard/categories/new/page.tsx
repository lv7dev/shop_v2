import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCategoryOptions } from "@/services/categories";

const CategoryForm = dynamic(
  () => import("@/components/admin/category-form").then((mod) => mod.CategoryForm)
);

export const metadata: Metadata = {
  title: "Create Category",
};

export default async function NewCategoryPage() {
  const parentCategories = await getCategoryOptions();

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
        <h1 className="text-3xl font-bold">Create Category</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a new product category.
        </p>
      </div>

      <div className="rounded-lg border p-6">
        <CategoryForm parentCategories={parentCategories} />
      </div>
    </div>
  );
}
