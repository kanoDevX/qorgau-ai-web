import type { Metadata, Viewport } from "next";
import { LazyGlobals } from "@/components/layout/lazy-globals";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { Inter, JetBrains_Mono, Unbounded } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { Providers } from "./providers";
import { AnalyticsGate, CookieConsent } from "@/components/layout/cookie-consent";
import "./globals.css";

/*
 * Fonts are downloaded at build time and served from our own origin (no runtime request to Google,
 * §3.8). All three are SIL OFL 1.1 and include the Kazakh letters ә ғ қ ң ө ұ ү һ і via cyrillic-ext
 * (docs/LICENSES.md). Unbounded is used only for h1 display titles.
 */
const inter = Inter({ subsets: ["latin", "cyrillic", "cyrillic-ext"], variable: "--font-inter", display: "optional" });
const unbounded = Unbounded({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["500", "600"],
  variable: "--font-unbounded",
  // "optional": the very wide display face would reflow the headline when it swaps in (layout shift);
  // it is preloaded, so it is normally ready for the first paint, otherwise the fallback stays for that page view.
  display: "optional",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: { default: t("title"), template: "%s · QorgauAI" },
    description: t("description"),
    applicationName: "QorgauAI",
    manifest: "/manifest.webmanifest",
    icons: { icon: [{ url: "/icons/icon-192.png", sizes: "192x192" }, { url: "/icons/icon-512.png", sizes: "512x512" }], apple: "/icons/apple-touch-icon.png" },
    appleWebApp: { capable: true, title: "QorgauAI", statusBarStyle: "black-translucent" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a1a1e" },
    { media: "(prefers-color-scheme: light)", color: "#f2f6f5" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const t = await getTranslations("common");
  const jar = await cookies();
  // Per-request CSP nonce from src/middleware.ts: next-themes' inline theme script needs it.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const density = jar.get("qorgau_density")?.value === "comfortable" ? "comfortable" : "default";
  const contrast = jar.get("qorgau_contrast")?.value === "more" ? "more" : undefined;

  return (
    <html
      lang={locale}
      data-density={density}
      data-contrast={contrast}
      className={`${inter.variable} ${unbounded.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <body>
        <a href="#main" className="skip-link">
          {t("skipToContent")}
        </a>
        <Providers nonce={nonce}>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
            <CookieConsent />
            <AnalyticsGate />
            <LazyGlobals />
            <RegisterServiceWorker />
          </NextIntlClientProvider>
        </Providers>
        <div id="live-region" aria-live="polite" aria-atomic="true" className="sr-only" />
      </body>
    </html>
  );
}
