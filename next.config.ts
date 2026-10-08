import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:5199";
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Development only: let the dev server be opened by a LAN address (e.g. a phone on the same Wi-Fi).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
  // Metadata is written into <head> before the response is flushed, not streamed into <body>: crawlers and
  // Lighthouse only read the head (SEO audit: meta description).
  htmlLimitedBots: /.*/,
  // Inline the (small) CSS instead of a render-blocking stylesheet request: ~1 s faster first paint on 4G.
  experimental: { inlineCss: true },
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_API_ORIGIN: API_ORIGIN,
  },
  // IA 2.0 (§5.2): retired URLs keep working for old links and bookmarks.
  async redirects() {
    return [
      { source: "/guardian", destination: "/family", permanent: true },
      { source: "/graph", destination: "/radar?tab=network", permanent: true },
      { source: "/notifications", destination: "/dashboard", permanent: false },
      { source: "/lookup", destination: "/check", permanent: true },
      { source: "/second-opinion", destination: "/check?mode=transfer", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Content-Security-Policy is set per request with a nonce in src/middleware.ts
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
