import type { CardVariant } from "@/types/product";

/**
 * Converts Prisma variant data (with nested options.facetValue.facet)
 * into the flat CardVariant[] shape for client transport.
 *
 * Reference shape: same include used by getProductBySlug() in services/products.ts
 */
export function serializeVariants(
  prismaVariants: {
    id: string;
    price: { toNumber?: () => number } | number;
    stock: number;
    options: {
      facetValue: {
        id: string;
        value: string;
        facet: { id: string; name: string };
      };
    }[];
  }[]
): CardVariant[] {
  return prismaVariants.map((v) => ({
    id: v.id,
    price: typeof v.price === "number" ? v.price : Number(v.price),
    stock: v.stock,
    options: v.options.map((o) => ({
      facetId: o.facetValue.facet.id,
      facetName: o.facetValue.facet.name,
      facetValueId: o.facetValue.id,
      facetValue: o.facetValue.value,
    })),
  }));
}
