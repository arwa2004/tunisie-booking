import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
};

// Sentry uniquement en production (incompatible avec Turbopack en dev)
export default process.env.NODE_ENV === "production"
  ? withSentryConfig(nextConfig, {
      org: "tunisie-booking",
      project: "javascript-nextjs",
      silent: !process.env.CI,
      widenClientFileUpload: true,
    })
  : nextConfig;
