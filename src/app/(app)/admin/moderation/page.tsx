"use client";

import { useLocale, useTranslations } from "next-intl";
import { Check, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/primitives";
import { PageHeader } from "@/components/layout/page-header";
import { useModerate, useModerationQueue } from "@/lib/api/hooks";
import { ApiError } from "@/lib/api/client";
import { KZ_REGIONS } from "@/lib/kz";
import { SCAM_CATEGORY_LABELS } from "@/lib/risk";
import type { Locale } from "@/lib/i18n/config";
import { formatRelative } from "@/lib/utils";

/** Moderation queue (§4.3) for Reviewer / Admin. The server enforces the role; this page just shows the queue. */
export default function ModerationPage() {
  const t = useTranslations("moderation");
  const locale = useLocale() as Locale;
  const queue = useModerationQueue();
  const moderate = useModerate();
  const forbidden = queue.error instanceof ApiError && (queue.error.status === 403 || queue.error.status === 401);

  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      {queue.isLoading && <Skeleton className="h-40 w-full rounded-[var(--radius-xl)]" />}
      {forbidden && <Card className="max-w-2xl p-5 text-sm text-[var(--text-muted)]">{t("forbidden")}</Card>}
      {queue.data?.length === 0 && <Card className="max-w-2xl p-5 text-sm text-[var(--text-muted)]">{t("empty")}</Card>}
      <ul className="max-w-3xl space-y-3">
        {queue.data?.map((r) => (
          <li key={r.reportId}>
            <Card className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <code className="font-id rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[var(--text)]">{r.identifierMasked}</code>
                <span className="text-[var(--text-muted)]">{SCAM_CATEGORY_LABELS[String(r.category)]?.[locale] ?? r.category}</span>
                {r.regionCode && <span className="text-[var(--text-subtle)]">{KZ_REGIONS.find((x) => x.code === r.regionCode)?.[locale]}</span>}
                <span className="text-xs text-[var(--text-subtle)]">{formatRelative(r.createdOnUtc, locale)}</span>
              </div>
              <p className="text-sm text-[var(--text)]">{r.narrative}</p>
              <p className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                <span className="inline-flex items-center gap-1"><ThumbsUp className="size-3.5" aria-hidden /> {t("helpful", { count: r.helpful ?? 0 })}</span>
                <span className="inline-flex items-center gap-1"><ThumbsDown className="size-3.5" aria-hidden /> {t("notHelpful", { count: r.notHelpful ?? 0 })}</span>
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => moderate.mutate({ reportId: r.reportId, approve: true })} disabled={moderate.isPending}>
                  <Check className="size-4" aria-hidden /> {t("approve")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => moderate.mutate({ reportId: r.reportId, approve: false })} disabled={moderate.isPending}>
                  <X className="size-4" aria-hidden /> {t("reject")}
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
