"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

const Inner = dynamic(() => import("./lazy-globals-inner"), { ssr: false });

/**
 * The command palette (cmdk) and the shortcut cheat sheet aren't needed to paint the first screen, so they
 * load after the page is idle — or on the first key press. Every key pressed until they are mounted is
 * remembered and replayed in order (a "?" is Shift then "?", so the first key alone isn't enough), so
 * Ctrl+K and "?" work immediately. Keeps hydration work (and LCP on a phone) down.
 */
export function LazyGlobals() {
  const [ready, setReady] = useState(false);
  const queue = useRef<KeyboardEvent[]>([]);
  const listening = useRef(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!listening.current) return;
      queue.current.push(e);
      setReady(true);
    };
    document.addEventListener("keydown", onKey, true);

    const load = () => setReady(true);
    // Safari lacks requestIdleCallback; a plain timer is a fine stand-in (the page is idle by then).
    const idle = typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(load, { timeout: 3000 }) : undefined;
    const timer = idle === undefined ? window.setTimeout(load, 2000) : undefined;

    return () => {
      document.removeEventListener("keydown", onKey, true);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  const replay = useCallback(() => {
    listening.current = false; // from here on the real listeners see the keys themselves
    const pending = queue.current;
    queue.current = [];
    for (const e of pending) {
      const { type, key, code, ctrlKey, metaKey, shiftKey, altKey } = e;
      (e.target ?? document).dispatchEvent(new KeyboardEvent(type, { key, code, ctrlKey, metaKey, shiftKey, altKey, bubbles: true, cancelable: true }));
    }
  }, []);

  return ready ? <Inner onMounted={replay} /> : null;
}
