// This file configures the initialization of Sentry on the browser (client).
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://69fc91f954834765884bce7a9f873ebe@o4511668502265856.ingest.de.sentry.io/4511668536803408",

  // Define how likely traces are sampled.
  // In dev we keep it at 1 to validate events are sent.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Print useful info in the console while setting up
  debug: true,

  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,

  integrations: [],
});
