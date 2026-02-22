import { init, getClient, captureRouterTransitionStart } from "@sentry/nextjs";

init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  // Capture 10% of transactions in production to stay within free tier limits
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Replay sample rates — the integration itself is lazy-loaded below
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});

// Lazy-load Session Replay after page is interactive (~110 KiB saved from initial bundle)
if (typeof window !== "undefined") {
  const idleCallback =
    window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 2000));

  idleCallback(async () => {
    const { replayIntegration } = await import("@sentry/nextjs");
    const client = getClient();
    if (client) {
      client.addIntegration(replayIntegration());
    }
  });
}

// Instrument Next.js route transitions for performance monitoring
export const onRouterTransitionStart = captureRouterTransitionStart;
