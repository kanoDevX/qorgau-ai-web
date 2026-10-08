"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, ShieldPlus, X } from "lucide-react";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/primitives";
import { ConsentCheckbox } from "@/components/ui/consent-checkbox";
import { useSubmitReport } from "@/lib/api/hooks";
import { toApiError } from "@/lib/api/client";
import { IDENTIFIER_KINDS, KZ_REGIONS, REPORT_CATEGORIES } from "@/lib/kz";
import { SCAM_CATEGORY_LABELS } from "@/lib/risk";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

// Validation messages are i18n keys, translated at render time.
const schema = z.object({
  primaryIdentifier: z.string().trim().min(3, "vIdentifier"),
  primaryIdentifierKind: z.string().optional(),
  category: z.enum(REPORT_CATEGORIES),
  narrative: z.string().trim().min(10, "vNarrative").max(4000),
  regionCode: z.string().optional(),
  claimedLossTenge: z.coerce.number().nonnegative().optional(),
  consent: z.boolean().refine((v) => v, "vConsent"),
});
type FormValues = z.input<typeof schema>;

export function ReportForm({
  trigger,
  defaultOpen = false,
  defaultCategory,
}: {
  trigger: React.ReactNode;
  /** Open immediately (deep link from a verdict: /radar?report=1&category=…). */
  defaultOpen?: boolean;
  defaultCategory?: string;
}) {
  const t = useTranslations("radar");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;
  const [open, setOpen] = useState(defaultOpen);
  const [doneId, setDoneId] = useState<string | null>(null);
  const submit = useSubmitReport();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: (REPORT_CATEGORIES as readonly string[]).includes(defaultCategory ?? "")
        ? (defaultCategory as (typeof REPORT_CATEGORIES)[number])
        : "BankImpersonationCall",
      consent: false, // never pre-ticked (§3.6)
    },
  });

  const category = watch("category");
  const region = watch("regionCode");
  const kind = watch("primaryIdentifierKind");
  const consent = watch("consent");

  const onSubmit = handleSubmit(async (v) => {
    const res = await submit.mutateAsync({
      primaryIdentifier: v.primaryIdentifier,
      primaryIdentifierKind: v.primaryIdentifierKind || null,
      category: v.category,
      narrative: v.narrative,
      regionCode: v.regionCode || null,
      claimedLossTenge: v.claimedLossTenge ?? null,
    });
    setDoneId(res.reportId);
  });

  function close() {
    setOpen(false);
    setTimeout(() => {
      reset();
      setDoneId(null);
      submit.reset();
    }, 200);
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--scrim)] backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow-pop)]">
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="flex items-center gap-2 text-lg font-semibold text-[var(--text)]">
              <ShieldPlus className="size-5 text-[var(--brand)]" /> {t("submit")}
            </Dialog.Title>
            <Dialog.Close className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--surface-2)]">
              <X className="size-4" />
            </Dialog.Close>
          </div>

          {doneId ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 py-8 text-center"
            >
              <CheckCircle2 className="size-12 text-[var(--risk-safe)]" />
              <p className="font-semibold text-[var(--text)]">{t("thanks")}</p>
              <p className="max-w-xs text-sm text-[var(--text-muted)]">
                {t("thanksBody")}
              </p>
              <code className="rounded bg-[var(--surface-2)] px-2 py-1 font-mono text-xs text-[var(--text-subtle)]">
                {doneId.slice(0, 8)}
              </code>
              <Button variant="outline" className="mt-2" onClick={close}>
                {tc("done")}
              </Button>
            </motion.div>
          ) : (
            <form onSubmit={onSubmit} className="mt-4 space-y-4">
              <Field label={t("fIdentifier")} error={errors.primaryIdentifier?.message && t(errors.primaryIdentifier.message as never)}>
                <Input placeholder="+7 700 000 00 00 · KZ… · scam-site.com" {...register("primaryIdentifier")} />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {IDENTIFIER_KINDS.map((k) => (
                    <button
                      key={k.value}
                      type="button"
                      onClick={() => setValue("primaryIdentifierKind", kind === k.value ? "" : k.value)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs transition-colors",
                        kind === k.value
                          ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                          : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)]",
                      )}
                    >
                      {locale === "en" ? k.en : k.ru}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label={t("fCategory")}>
                <div className="flex flex-wrap gap-1.5">
                  {REPORT_CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setValue("category", c)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs transition-colors",
                        category === c
                          ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                          : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)]",
                      )}
                    >
                      {SCAM_CATEGORY_LABELS[c]?.[locale] ?? c}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label={t("fNarrative")} error={errors.narrative?.message && t(errors.narrative.message as never)}>
                <Textarea
                  placeholder={t("fNarrativePh")}
                  {...register("narrative")}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label={t("fRegion")}>
                  <select
                    {...register("regionCode")}
                    className="h-10 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 text-sm text-[var(--text)] focus-visible:border-[var(--brand)] focus-visible:outline-none"
                  >
                    <option value="">—</option>
                    {KZ_REGIONS.map((r) => (
                      <option key={r.code} value={r.code}>
                        {locale === "en" ? r.en : r.ru}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t("fLoss")}>
                  <Input type="number" min={0} placeholder="0" {...register("claimedLossTenge")} />
                </Field>
              </div>

              <ConsentCheckbox
                id="report-consent"
                checked={consent === true}
                onChange={(v) => setValue("consent", v, { shouldValidate: true })}
                invalid={!!errors.consent}
                error={t("vConsent")}
                label={t("consentPublish")}
                linkHref="/legal/privacy"
                linkLabel={t("readPolicy")}
              />

              {submit.error && (
                <p className="text-xs text-[var(--risk-danger-fg)]">{toApiError(submit.error).message}</p>
              )}

              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-[11px] text-[var(--text-subtle)]">
                  {region ? t("regionIs", { region: KZ_REGIONS.find((r) => r.code === region)?.[locale] ?? region }) : t("anonymous")}
                </p>
                <Button type="submit" disabled={submit.isPending}>
                  {t("submit")}
                </Button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-[var(--risk-danger-fg)]">{error}</p>}
    </div>
  );
}
