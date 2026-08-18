"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function SentryExamplePage() {
  useEffect(() => {
    // Report an error to validate Sentry frontend is working in dev.
    // No throw here to avoid breaking the page UI / triggering Next error overlays.
    const err = new Error("Sentry frontend test: sentry-example-page");
    Sentry.captureException(err);
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>Sentry example</h1>
      <p>
        If Sentry is working, an event should appear in your Sentry project.
      </p>
    </main>
  );
}


