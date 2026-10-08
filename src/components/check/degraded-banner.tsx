import { useTranslations } from "next-intl";
import { CloudOff } from "lucide-react";

/**
 * P9: when the AI layer did not run, say so plainly — why, what the verdict is still based on,
 * and when to try again — instead of a vague "AI unavailable" chip.
 */
export function DegradedBanner({ reason, retryAfterSeconds }: { reason?: string | null; retryAfterSeconds?: number | null }) {
  const t = useTranslations("check.degraded");
  if (!reason || reason === "None" || reason === "FastMode") return null;
  const known = ["QuotaExceeded", "ProviderError", "Timeout", "NotConfigured", "Disabled"].includes(reason);
  const minutes = retryAfterSeconds ? Math.max(1, Math.ceil(retryAfterSeconds / 60)) : null;

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-[var(--radius-xl)] border border-[var(--risk-caution)] bg-[var(--risk-caution-bg)] p-4 text-sm text-[var(--risk-caution-fg)]"
      data-testid="degraded-banner"
    >
      <CloudOff className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="space-y-1">
        <p className="font-semibold">{t(`title.${known ? reason : "ProviderError"}` as never)}</p>
        <p>{t("basis")}</p>
        {minutes !== null && <p>{t("eta", { minutes })}</p>}
      </div>
    </div>
  );
}
