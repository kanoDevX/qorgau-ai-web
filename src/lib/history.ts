"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * On-device history of the viewer's own checks. Deliberately stores NO message text — only the
 * verdict metadata — so it stays consistent with the "we don't store your messages" promise and
 * is safe on a shared phone. Per-device convenience only; never the source of truth.
 */
export interface CheckHistoryEntry {
  id: string; // assessmentId
  at: string; // ISO time
  score: number;
  band: string;
  category: string;
  medium: "text" | "image" | "audio";
}

const KEY = "qorgau.checkHistory.v1";
const MAX = 20;
const EVENT = "qorgau:history";

function read(): CheckHistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as CheckHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function recordCheck(entry: CheckHistoryEntry) {
  try {
    const next = [entry, ...read().filter((e) => e.id !== entry.id)].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* storage unavailable (private mode / quota) — history is optional */
  }
}

export function clearCheckHistory() {
  try {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* ignore */
  }
}

/** Reactive view of the history; empty during SSR and on first paint (no hydration mismatch). */
export function useCheckHistory() {
  const [items, setItems] = useState<CheckHistoryEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setItems(read());
    sync();
    setReady(true);
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync); // other tabs
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const clear = useCallback(() => clearCheckHistory(), []);
  return { items, ready, clear };
}

/* ---- tiny device-local flags for the "next best action" checklist ---- */

const FLAG_PREFIX = "qorgau.flag.";

export function setFlag(name: string) {
  try {
    window.localStorage.setItem(FLAG_PREFIX + name, new Date().toISOString());
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* ignore */
  }
}

export function useFlag(name: string) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const sync = () => {
      try {
        setOn(!!window.localStorage.getItem(FLAG_PREFIX + name));
      } catch {
        setOn(false);
      }
    };
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, [name]);
  return on;
}
