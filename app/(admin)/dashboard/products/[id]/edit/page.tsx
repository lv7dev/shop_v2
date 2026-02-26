import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { getCategories } from "@/services/categories";
import { getFacets } from "@/services/facets";
import { getAdminProductById } from "@/services/admin";

const ProductForm = dynamic(
  () => import("@/components/admin/product-form").then((mod) => mod.ProductForm),
  { loading: () => <div className="h-96 animate-pulse rounded-lg bg-muted" /> }
);

export const metadata: Metadata = {
  title: "Edit Product",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;

  const [product, categories, facets] = await Promise.all([
    getAdminProductById(id),
    getCategories(),
    getFacets(),
  ]);

  if (!product) {
    notFound();
  }

  const productData = {
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    sku: product.sku,
    stock: product.stock,
    images: product.images,
    isActive: product.isActive,
    categoryId: product.categoryId,
    facetValueIds: product.facetValues.map((pfv) => pfv.facetValueId),
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      price: Number(v.price),
      stock: v.stock,
      facetValueIds: v.options.map((o) => o.facetValueId),
    })),
  };

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
      <h1 className="mb-8 text-3xl font-bold">Edit Product</h1>
      <ProductForm
        categories={categories}
        facets={facetData}
        product={productData}
      />
    </div>
  );
}
