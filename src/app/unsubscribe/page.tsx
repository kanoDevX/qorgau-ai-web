"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

/**
 * Landing page of the visible "unsubscribe" link in every digest (§3.18). No login. Opening the page
 * never unsubscribes by itself (mail scanners prefetch links) — one button press does. Mail clients
 * that support RFC 8058 unsubscribe without even opening this page.
 */
function Unsubscribe() {
  const t = useTranslations("unsubscribe");
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<"checking" | "valid" | "invalid" | "done" | "error">("checking");

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    fetch(`/backend/api/v1/unsubscribe?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((j: { valid?: boolean }) => setState(j.valid ? "valid" : "invalid"))
      .catch(() => setState("error"));
  }, [token]);

  async function confirm() {
    const res = await fetch(`/backend/api/v1/unsubscribe?token=${encodeURIComponent(token)}`, { method: "POST" }).catch(() => null);
    setState(res?.ok ? "done" : "error");
  }

  return (
    <main id="main" className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4">
      <Logo className="mb-8" />
      <h1 className="text-[length:var(--text-title)] text-[var(--text)]">{t("title")}</h1>
      <div role="status" aria-live="polite" className="mt-4 space-y-4 text-[var(--text-muted)]">
        {state === "checking" && <p>{t("checking")}</p>}
        {state === "valid" && (
          <>
            <p>{t("confirmLead")}</p>
            <Button size="lg" onClick={confirm}>
              {t("confirm")}
            </Button>
          </>
        )}
        {state === "done" && <p className="font-medium text-[var(--risk-safe-fg)]">{t("done")}</p>}
        {state === "invalid" && <p>{t("invalid")}</p>}
        {state === "error" && <p>{t("error")}</p>}
        <p className="text-sm">
          <Link href="/settings/notifications" className="text-[var(--brand)] underline underline-offset-2">
            {t("manage")}
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function UnsubscribePage() {
  return (
    <div className="bg-[var(--bg)]">
      <Suspense>
        <Unsubscribe />
      </Suspense>
    </div>
  );
}
