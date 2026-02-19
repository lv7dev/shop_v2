import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Filter out noise from aborted requests (e.g. user spam-reloading)
  beforeSend(event) {
    const message = event.exception?.values?.[0]?.value ?? "";
    if (
      message.includes("aborted") ||
      message.includes("ECONNRESET") ||
      message.includes("NEXT_HTTP_ERROR_FALLBACK")
    ) {
      return null;
    }
    return event;
  },
});
