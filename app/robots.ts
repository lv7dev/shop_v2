import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/seo";
import { locales } from "@/i18n/config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  // Disallow paths for all locales
  const privatePaths = ["/dashboard", "/api/", "/checkout", "/cart", "/account"];
  const disallow = [
    ...privatePaths,
    ...locales.flatMap((l) => privatePaths.map((p) => `/${l}${p}`)),
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
