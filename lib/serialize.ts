import type { CardVariant, CardFacet } from "@/types/product";

/** Shape of a Prisma variant row with nested options/facetValue/facet includes */
type PrismaVariantRow = {
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
};

/**
 * Converts Prisma variant data (with nested options.facetValue.facet)
 * into the flat CardVariant[] shape for client transport.
 */
export function serializeVariants(
  prismaVariants: PrismaVariantRow[]
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

/** Shape of a Prisma ProductFacetValue row with nested facetValue/facet */
type PrismaProductFacetValueRow = {
  facetValue: {
    value: string;
    facet: { name: string };
  };
};

/**
 * Converts Prisma ProductFacetValue data into CardFacet[] grouped by facet name.
 */
export function serializeFacets(
  prismaFacetValues?: PrismaProductFacetValueRow[]
): CardFacet[] {
  if (!prismaFacetValues || prismaFacetValues.length === 0) return [];

  const groups = new Map<string, string[]>();
  for (const pfv of prismaFacetValues) {
    const name = pfv.facetValue.facet.name;
    if (!groups.has(name)) groups.set(name, []);
    const values = groups.get(name)!;
    if (!values.includes(pfv.facetValue.value)) {
      values.push(pfv.facetValue.value);
    }
  }

  return Array.from(groups.entries()).map(([facetName, values]) => ({
    facetName,
    values,
  }));
}
