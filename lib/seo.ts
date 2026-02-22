import type { Metadata } from "next";
import { APP_NAME } from "./constants";

/**
 * Base URL for canonical links, OG images, and sitemap.
 * Falls back to VERCEL_URL in preview deploys, then localhost.
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

const SITE_DESCRIPTION =
  "Discover premium products at unbeatable prices. Shop our curated collection with free shipping on orders over $50.";

/**
 * Shared root metadata — imported by the root layout.
 */
export const rootMetadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    locale: "en_US",
    title: {
      default: APP_NAME,
      template: `%s | ${APP_NAME}`,
    },
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: APP_NAME,
      template: `%s | ${APP_NAME}`,
    },
    description: SITE_DESCRIPTION,
  },
  alternates: {
    canonical: "/",
  },
};

/**
 * Helper to build page-level metadata with OG + Twitter + canonical.
 */
export function buildPageMetadata({
  title,
  description,
  path,
  images,
  noIndex = false,
}: {
  title: string;
  description: string;
  path: string;
  images?: string[];
  noIndex?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
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
