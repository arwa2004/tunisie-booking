import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
};

export default withSentryConfig(nextConfig, {
  org: "tunisie-booking",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: true,
});



