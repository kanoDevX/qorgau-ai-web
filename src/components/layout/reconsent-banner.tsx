"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useMyConsents, useSetConsent } from "@/lib/api/hooks";
import { useSession } from "@/lib/auth/session";

/**
 * App-wide prompt when the privacy policy version changed since the user last agreed (§3.1).
 * Shown only to signed-in users whose DataProcessing consent is older than PolicyVersions.Privacy.
 */
export function ReconsentBanner() {
  const t = useTranslations("privacy");
  const { isAuthenticated } = useSession();
  const consents = useMyConsents(isAuthenticated);
  const accept = useSetConsent();

  if (!isAuthenticated || !consents.data || consents.data.policyUpToDate) return null;

  return (
    <div
      role="region"
      aria-label={t("reconsentTitle")}
      className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--risk-caution)] bg-[var(--risk-caution-bg)] p-4 text-sm text-[var(--risk-caution-fg)]"
      data-testid="reconsent-banner"
    >
      <div>
        <p className="font-semibold">{t("reconsentTitle")}</p>
        <p className="mt-0.5">
          {t("reconsentBody")}{" "}
          <Link href="/legal/privacy" className="underline underline-offset-2">
            {t("policyRead")}
          </Link>
        </p>
      </div>
      <Button size="sm" disabled={accept.isPending} onClick={() => accept.mutate({ scope: "DataProcessing", granted: true })}>
        {t("reconsentAccept")}
      </Button>
    </div>
  );
}
