"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", textAlign: "center", padding: "1rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>Something went wrong</h1>
          <p style={{ color: "#6b7280", maxWidth: "28rem" }}>
            A critical error occurred. Please try again or go back to the home page.
          </p>
          {error.digest && (
            <p style={{ color: "#9ca3af", fontSize: "0.75rem" }}>
              Error ID: {error.digest}
            </p>
          )}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={reset}
              style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", backgroundColor: "#000", color: "#fff", border: "none", cursor: "pointer" }}
            >
              Try Again
            </button>
            <Link
              href="/"
              style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", backgroundColor: "transparent", color: "#000", border: "1px solid #d1d5db", textDecoration: "none", cursor: "pointer" }}
            >
              Go Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
