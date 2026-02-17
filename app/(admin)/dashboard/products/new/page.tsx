import type { Metadata } from "next";
import { getCategories } from "@/services/categories";
import { getFacets } from "@/services/facets";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = {
  title: "Create Product",
};

export default async function CreateProductPage() {
  const [categories, facets] = await Promise.all([
    getCategories(),
    getFacets(),
  ]);

  // Flatten facets for the form (just id/name/slug/values)
  const facetData = facets.map((f) => ({
    id: f.id,
    name: f.name,
    slug: f.slug,
    values: f.values.map((v) => ({
      id: v.id,
      value: v.value,
      slug: v.slug,
    })),
  }));

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Create Product</h1>
      <ProductForm categories={categories} facets={facetData} />
    </div>
  );
}
