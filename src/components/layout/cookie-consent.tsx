"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Cookie, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/primitives";
import {
  CONSENT_EVENT,
  OPEN_SETTINGS_EVENT,
  readConsent,
  writeConsent,
  type ConsentState,
} from "@/lib/consent";

const NONE: ConsentState = { preferences: false, analytics: false };
const ALL: ConsentState = { preferences: true, analytics: true };

/**
 * ePrivacy-style banner. "Accept all" and "Reject all" are the same variant and size on purpose —
 * no dark pattern (§3.5). Nothing but strictly-necessary cookies is written until the visitor chooses.
 */
export function CookieConsent() {
  const t = useTranslations("cookies");
  const [decided, setDecided] = useState(true); // avoid a flash before hydration
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ConsentState>(NONE);

  useEffect(() => {
    const current = readConsent();
    setDecided(current !== null);
    if (current) setDraft(current);
    const openSettings = () => {
      setDraft(readConsent() ?? NONE);
      setOpen(true);
    };
    document.addEventListener(OPEN_SETTINGS_EVENT, openSettings);
    return () => document.removeEventListener(OPEN_SETTINGS_EVENT, openSettings);
  }, []);

  const choose = useCallback((state: ConsentState) => {
    writeConsent(state);
    setDecided(true);
    setOpen(false);
  }, []);

  return (
    <>
      {!decided && (
        <section
          aria-label={t("bannerLabel")}
          className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-3xl rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow-pop)] md:bottom-5 md:p-5"
          data-testid="cookie-banner"
        >
          <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
            <Cookie className="size-4 text-[var(--brand)]" aria-hidden /> {t("title")}
          </p>
          <p className="mt-1.5 text-sm text-[var(--text-muted)]">
            {t("body")}{" "}
            <Link href="/legal/cookies" className="text-[var(--brand)] underline underline-offset-2">
              {t("policyLink")}
            </Link>
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Button variant="outline" onClick={() => choose(NONE)}>
              {t("rejectAll")}
            </Button>
            <Button variant="outline" onClick={() => choose(ALL)}>
              {t("acceptAll")}
            </Button>
            <Button variant="ghost" onClick={() => setOpen(true)}>
              {t("customize")}
            </Button>
          </div>
        </section>
      )}

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[70] bg-[var(--scrim)]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[71] max-h-[90dvh] w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-pop)]">
            <div className="flex items-start justify-between gap-3">
              <Dialog.Title className="text-lg font-semibold text-[var(--text)]">{t("settingsTitle")}</Dialog.Title>
              <Dialog.Close
                className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
                aria-label={t("close")}
              >
                <X className="size-4" />
              </Dialog.Close>
            </div>
            <Dialog.Description className="mt-1 text-sm text-[var(--text-muted)]">{t("settingsLead")}</Dialog.Description>

            <div className="mt-4 space-y-4">
              <Row label={t("necessary")} hint={t("necessaryHint")} checked disabled />
              <Row
                label={t("preferences")}
                hint={t("preferencesHint")}
                checked={draft.preferences}
                onChange={(v) => setDraft((d) => ({ ...d, preferences: v }))}
              />
              <Row
                label={t("analytics")}
                hint={t("analyticsHint")}
                checked={draft.analytics}
                onChange={(v) => setDraft((d) => ({ ...d, analytics: v }))}
              />
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <Button variant="outline" onClick={() => choose(NONE)}>
                {t("rejectAll")}
              </Button>
              <Button variant="outline" onClick={() => choose(ALL)}>
                {t("acceptAll")}
              </Button>
              <Button onClick={() => choose(draft)}>{t("save")}</Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

function Row({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-[var(--text)]">{label}</p>
        <p className="text-xs text-[var(--text-muted)]">{hint}</p>
      </div>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

/** Loads the analytics script only after an explicit opt-in (§3.5, §5.5: no external script before consent). */
export function AnalyticsGate() {
  const src = process.env.NEXT_PUBLIC_ANALYTICS_SRC;
  const [on, setOn] = useState(false);

  useEffect(() => {
    const sync = () => setOn(readConsent()?.analytics === true);
    sync();
    document.addEventListener(CONSENT_EVENT, sync);
    return () => document.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!on || !src) return;
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.qorgauAnalytics = "true";
    document.head.appendChild(script);
    return () => script.remove();
  }, [on, src]);

  return null;
}

/** Footer / settings link that reopens the dialog. */
export function CookieSettingsButton({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <button type="button" className={className} onClick={() => document.dispatchEvent(new CustomEvent(OPEN_SETTINGS_EVENT))}>
      {children}
    </button>
  );
}
