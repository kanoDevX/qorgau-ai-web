"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { type ReactNode, useEffect, useState } from "react";

export function Providers({ children, nonce }: { children: ReactNode; nonce?: string }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  // Follow the OS "increase contrast" setting unless the user chose explicitly (qorgau_contrast cookie).
  useEffect(() => {
    if (document.cookie.includes("qorgau_contrast=")) return;
    const mq = window.matchMedia("(prefers-contrast: more)");
    const apply = () => {
      if (mq.matches) document.documentElement.dataset.contrast = "more";
      else delete document.documentElement.dataset.contrast;
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <ThemeProvider nonce={nonce} attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
