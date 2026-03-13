import type { Metadata } from "next";
import { APP_NAME } from "./constants";
import { locales } from "@/i18n/config";

/**
 * Base URL for canonical links, OG images, and sitemap.
 * Falls back to VERCEL_URL in preview deploys, then localhost.
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** Map locale code to OpenGraph locale format */
export function ogLocale(locale: string): string {
  const map: Record<string, string> = { vi: "vi_VN", en: "en_US" };
  return map[locale] ?? "vi_VN";
}

/**
 * Build root metadata for a given locale — called from the root layout.
 */
export function getRootMetadata(locale: string, siteDescription: string): Metadata {
  return {
    metadataBase: new URL(getBaseUrl()),
    title: {
      default: APP_NAME,
      template: `%s | ${APP_NAME}`,
    },
    description: siteDescription,
    openGraph: {
      type: "website",
      siteName: APP_NAME,
      locale: ogLocale(locale),
      alternateLocale: locales
        .filter((l) => l !== locale)
        .map((l) => ogLocale(l)),
      title: {
        default: APP_NAME,
        template: `%s | ${APP_NAME}`,
      },
      description: siteDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: {
        default: APP_NAME,
        template: `%s | ${APP_NAME}`,
      },
      description: siteDescription,
    },
    alternates: {
      canonical: "/",
      languages: Object.fromEntries(
        locales.map((l) => [l, `/${l}`])
      ),
    },
  };
}

/**
 * Helper to build page-level metadata with OG + Twitter + canonical.
 */
export function buildPageMetadata({
  title,
  description,
  path,
  images,
  noIndex = false,
  locale,
}: {
  title: string;
  description: string;
  path: string;
  images?: string[];
  noIndex?: boolean;
  locale?: string;
}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
      ...(locale && {
        languages: Object.fromEntries(
          locales.map((l) => [l, `/${l}${path}`])
        ),
      }),
    },
    openGraph: {
      title,
      description,
      url: path,
      ...(locale && { locale: ogLocale(locale) }),
      ...(images && images.length > 0 && { images }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(images && images.length > 0 && { images }),
    },
    ...(noIndex && { robots: { index: false, follow: false } }),
  };
}
