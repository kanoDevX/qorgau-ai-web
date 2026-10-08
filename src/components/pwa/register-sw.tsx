"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (offline emergency plan + push) in production builds only: in dev a
 * caching worker would mask code changes. Registration waits for `load` so it never competes with the page.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const register = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);
  return null;
}
