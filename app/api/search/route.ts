import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(
    Number(request.nextUrl.searchParams.get("limit")) || 5,
    10
  );

  if (q.length < 2) {
    return NextResponse.json({ products: [], categories: [] });
  }

  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        images: true,
        category: { select: { name: true, slug: true } },
      },
      take: limit,
      orderBy: { name: "asc" },
    }),
    db.category.findMany({
      where: {
        name: { contains: q, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { products: { where: { isActive: true } } } },
      },
      take: limit,
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      image: p.images[0] ?? "",
      category: p.category?.name ?? null,
    })),
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      productCount: c._count.products,
    })),
  });
}
