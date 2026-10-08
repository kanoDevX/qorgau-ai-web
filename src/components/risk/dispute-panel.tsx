"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/primitives";
import { useDisputeAssessment } from "@/lib/api/hooks";
import { useSession } from "@/lib/auth/session";
import { toApiError } from "@/lib/api/client";

/**
 * Inline "this verdict is wrong" flow. Auth-gated (the backend endpoint requires a JWT).
 * On submit it routes the assessment to human review — the Explainable-AI / HITL loop.
 */
export function DisputePanel({
  assessmentId,
  onClose,
}: {
  assessmentId: string;
  onClose: () => void;
}) {
  const t = useTranslations("check");
  const { isAuthenticated, signInDemo } = useSession();
  const [reason, setReason] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const dispute = useDisputeAssessment();

  if (dispute.isSuccess) {
    return (
      <Card className="flex items-start gap-3 border-[var(--risk-safe)] bg-[var(--risk-safe-bg)] p-4">
        <Check className="mt-0.5 size-4 shrink-0 text-[var(--risk-safe-fg)]" aria-hidden />
        <p className="text-sm text-[var(--risk-safe-fg)]">{t("disputeSent")}</p>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">{t("disputeTitle")}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{t("disputeLead")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[var(--text-subtle)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
            aria-label={t("disputeCancel")}
          >
            <X className="size-4" />
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-[var(--text-muted)]">{t("disputeSignIn")}</p>
            <Button
              size="sm"
              variant="soft"
              disabled={signingIn}
              onClick={async () => {
                setSigningIn(true);
                try {
                  await signInDemo("self");
                } finally {
                  setSigningIn(false);
                }
              }}
            >
              {signingIn && <Loader2 className="size-3.5 animate-spin" />}
              {t("disputeSubmit")}
            </Button>
          </div>
        ) : (
          <form
            className="mt-3 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (reason.trim().length < 4) return;
              dispute.mutate({ id: assessmentId, reason: reason.trim() });
            }}
          >
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("disputeReasonPlaceholder")}
              className="min-h-[88px]"
              aria-label={t("disputeTitle")}
            />
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" disabled={reason.trim().length < 4 || dispute.isPending}>
                {dispute.isPending && <Loader2 className="size-3.5 animate-spin" />}
                {t("disputeSubmit")}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={onClose}>
                {t("disputeCancel")}
              </Button>
            </div>
            {dispute.isError && (
              <p className="text-xs text-[var(--risk-danger-fg)]">{toApiError(dispute.error).message}</p>
            )}
          </form>
        )}
      </Card>
    </motion.div>
  );
}
