import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const slugsParam = request.nextUrl.searchParams.get("slugs");
  if (!slugsParam) {
    return NextResponse.json({ products: [] });
  }

  const slugs = slugsParam.split(",").slice(0, 10);

  const products = await db.product.findMany({
    where: { slug: { in: slugs }, isActive: true },
    include: { category: true },
  });

  // Preserve the order of the input slugs
  const productMap = new Map(products.map((p) => [p.slug, p]));
  const ordered = slugs
    .map((slug) => productMap.get(slug))
    .filter(Boolean)
    .map((p) => ({
      id: p!.id,
      name: p!.name,
      slug: p!.slug,
      price: Number(p!.price),
      images: p!.images,
      stock: p!.stock,
      category: p!.category ? { name: p!.category.name, slug: p!.category.slug } : null,
    }));

  return NextResponse.json({ products: ordered });
}
