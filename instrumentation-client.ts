import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  // Capture 10% of transactions in production to stay within free tier limits
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% when errors occur

  integrations: [Sentry.replayIntegration()],

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});

// Instrument Next.js route transitions for performance monitoring
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
