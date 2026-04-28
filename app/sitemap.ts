import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { getBaseUrl } from "@/lib/seo";
import { locales } from "@/i18n/config";

export const dynamic = "force-dynamic";

function alternates(path: string) {
  const baseUrl = getBaseUrl();
  return {
    languages: Object.fromEntries(
      locales.map((l) => [l, `${baseUrl}/${l}${path}`])
    ),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  // Static pages
  const staticPaths = ["", "/products", "/categories"];
  const staticPages: MetadataRoute.Sitemap = staticPaths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: path === "" ? "daily" as const : "weekly" as const,
      priority: path === "" ? 1 : path === "/products" ? 0.9 : 0.8,
      alternates: alternates(path),
    }))
  );

  // Product pages
  const products = await db.product.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  const productPages: MetadataRoute.Sitemap = products.flatMap((p) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      alternates: alternates(`/products/${p.slug}`),
    }))
  );

  // Category pages
  const categories = await db.category.findMany({
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  const categoryPages: MetadataRoute.Sitemap = categories.flatMap((c) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/categories/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
      alternates: alternates(`/categories/${c.slug}`),
    }))
  );

  return [...staticPages, ...productPages, ...categoryPages];
}
