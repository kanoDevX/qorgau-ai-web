"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** "G then <key>" navigation, Gmail/Linear style. Targets follow the 5-section IA (§5.2). */
const GO_TO: Record<string, string> = {
  c: "/check",
  d: "/dashboard",
  r: "/radar",
  l: "/learn",
  f: "/family",
  s: "/settings",
};

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName);
}

/** Global shortcuts + the "?" cheat sheet (§3.15). Never fires while the user is typing. */
export function KeyboardShortcuts() {
  const t = useTranslations("shortcuts");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const pendingG = useRef<number | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;

      if (e.key === "?") {
        e.preventDefault();
        setOpen(true);
        return;
      }
      if (pendingG.current !== null) {
        window.clearTimeout(pendingG.current);
        pendingG.current = null;
        const href = GO_TO[e.key.toLowerCase()];
        if (href) {
          e.preventDefault();
          router.push(href);
        }
        return;
      }
      if (e.key.toLowerCase() === "g") {
        pendingG.current = window.setTimeout(() => (pendingG.current = null), 1200);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router]);

  const rows: [string[], string][] = [
    [["Ctrl", "K"], t("palette")],
    [["?"], t("help")],
    [["Esc"], t("close")],
    [["G", "C"], t("goCheck")],
    [["G", "D"], t("goDashboard")],
    [["G", "R"], t("goRadar")],
    [["G", "L"], t("goLearn")],
    [["G", "F"], t("goFamily")],
    [["G", "S"], t("goSettings")],
    [["←", "→", "↑", "↓"], t("graph")],
  ];

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-[var(--scrim)]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[81] w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-2xl)] border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-pop)]">
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="text-lg font-semibold text-[var(--text)]">{t("title")}</Dialog.Title>
            <Dialog.Close className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--surface-2)]" aria-label={t("close")}>
              <X className="size-4" aria-hidden />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1 text-sm text-[var(--text-muted)]">{t("lead")}</Dialog.Description>
          <dl className="mt-4 divide-y divide-[var(--border)]">
            {rows.map(([keys, label]) => (
              <div key={label} className="flex items-center justify-between gap-4 py-2 text-sm">
                <dt className="text-[var(--text-muted)]">{label}</dt>
                <dd className="flex shrink-0 gap-1">
                  {keys.map((k) => (
                    <kbd
                      key={k}
                      className="min-w-7 rounded-md border border-[var(--border-strong)] bg-[var(--surface-2)] px-1.5 py-0.5 text-center font-mono text-xs text-[var(--text)]"
                    >
                      {k}
                    </kbd>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
