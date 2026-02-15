import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // Use the tunnel route to avoid ad blockers blocking Sentry requests
  tunnelRoute: "/monitoring",

  // Suppress all Sentry SDK logs in the build output
  silent: !process.env.CI,

  // Automatically tree-shake the Sentry logger statements to reduce bundle size
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
