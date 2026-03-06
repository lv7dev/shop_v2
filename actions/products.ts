"use server";

import { getProducts, getActiveDiscountsForProducts } from "@/services/products";

type LoadMoreParams = {
  page: number;
  limit: number;
  categorySlug?: string;
  search?: string;
  facets?: Record<string, string[]>;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
};

export async function loadMoreProducts(params: LoadMoreParams) {
  const { products, totalPages } = await getProducts(params);

  const productIds = products.map((p) => p.id);
  const discountMap = await getActiveDiscountsForProducts(productIds);

  // Serialize products and discounts for client transport
  // Products from getProducts() include { category: true } relation
  const serialized = products.map((p) => {
    const cat = (p as typeof p & { category: { name: string; slug: string } | null }).category;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      images: p.images,
      stock: p.stock,
      category: cat ? { name: cat.name, slug: cat.slug } : null,
      activeDiscount: discountMap.get(p.id) ?? null,
    };
  });

  return {
    products: serialized,
    totalPages,
    hasMore: params.page < totalPages,
  };
}
