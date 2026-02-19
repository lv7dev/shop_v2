import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");

    // Suppress noisy ECONNRESET errors from Next.js dev server console.
    // These fire when the browser aborts a request (e.g. spam reload)
    // and are harmless. Only applied in dev — production is unaffected.
    if (process.env.NODE_ENV === "development") {
      const originalStderrWrite = process.stderr.write.bind(process.stderr);
      process.stderr.write = (
        chunk: Uint8Array | string,
        ...rest: unknown[]
      ): boolean => {
        const text = typeof chunk === "string" ? chunk : chunk.toString();
        if (
          text.includes("Error: aborted") ||
          text.includes("ECONNRESET")
        ) {
          return true; // swallow it
        }
        return (originalStderrWrite as (...a: unknown[]) => boolean)(chunk, ...rest);
      };
    }
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError: typeof Sentry.captureRequestError = (
  ...args
) => {
  const error = args[0];

  // Ignore aborted requests (user navigated away or spam-reloaded)
  if (
    error &&
    typeof error === "object" &&
    ("code" in error || "message" in error)
  ) {
    const code = "code" in error ? String(error.code) : "";
    const message = "message" in error ? String(error.message) : "";
    if (
      code === "ECONNRESET" ||
      message.includes("aborted") ||
      message.includes("ECONNRESET")
    ) {
      return;
    }
  }

  return Sentry.captureRequestError(...args);
};
