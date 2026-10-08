"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, EyeOff, Fingerprint, ShieldAlert, ShieldCheck } from "lucide-react";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Skeleton } from "@/components/ui/primitives";
import { PageHeader } from "@/components/layout/page-header";
import { SignInPrompt } from "@/components/auth/sign-in-prompt";
import { setFlag } from "@/lib/history";
import { ConsentCheckbox } from "@/components/ui/consent-checkbox";
import { useMyFamily, useSetSafeWord, useVerifyCaller } from "@/lib/api/hooks";
import { useSession } from "@/lib/auth/session";
import { toApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import {
  InviteCard,
  MembersCard,
  NoFamily,
  ProtectedExplainer,
  RotationCard,
  SosCard,
} from "@/components/family/family-circle";

export default function FamilyPage() {
  const t = useTranslations("family");

  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-[var(--brand)]/40 bg-[var(--brand-soft)] p-3.5 text-sm text-[var(--text)]">
        <EyeOff className="mt-0.5 size-4 shrink-0 text-[var(--brand)]" />
        {t("privacyBanner")}
      </div>
      <Suspense fallback={<Skeleton className="h-48 w-full rounded-xl" />}>
        <FamilyBody />
      </Suspense>
    </>
  );
}

function FamilyBody() {
  const t = useTranslations("family");
  const { userId, ready } = useSession();
  const search = useSearchParams();
  const family = useMyFamily(!!userId);

  if (ready && !userId) return <SignInPrompt />;
  if (!userId || family.isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;
  if (family.isError) return <p role="alert" className="text-sm text-[var(--risk-danger-fg)]">{toApiError(family.error).message}</p>;

  const f = family.data;
  if (!f) {
    const join = search.get("join");
    return (
      <div className="space-y-5">
        <h2 className="text-lg font-semibold text-[var(--text)]">{t("noFamily")}</h2>
        <NoFamily initialInvite={join ?? ""} />
        <ProtectedExplainer />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <MembersCard family={f} />
        <div className="space-y-5">
          <SosCard />
          {f.iAmGuardian && f.members.length < f.maxMembers && <InviteCard />}
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <RotationCard family={f} />
        <ProtectedExplainer />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <SafeWordWizard />
        <VerifyCaller ownerUserId={userId} />
      </div>
    </div>
  );
}

/* ---------- Safe-word 3-step wizard ---------- */

function SafeWordWizard() {
  const t = useTranslations("guardian.safeWord");
  const [step, setStep] = useState(0);
  const [label, setLabel] = useState("");
  const [phrase, setPhrase] = useState("");
  const setSafeWord = useSetSafeWord();
  const [consent, setConsent] = useState(false); // never pre-ticked (§3.6)

  const steps = [t("step1"), t("step2"), t("step3")];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <div className="mt-2 flex items-center gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-[var(--brand)]" : "bg-[var(--surface-3)]",
              )}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="0" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              <p className="text-sm text-[var(--text-muted)]">{t("explain")}</p>
              <label className="block text-xs font-medium text-[var(--text-muted)]">{t("label")}</label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t("labelPlaceholder")} />
              <label className="block text-xs font-medium text-[var(--text-muted)]">{t("phrase")}</label>
              <Input value={phrase} onChange={(e) => setPhrase(e.target.value)} type="password" placeholder="••••••" />
              <Button className="w-full" disabled={!label || phrase.length < 4} onClick={() => setStep(1)}>
                {t("step2")}
              </Button>
            </motion.div>
          )}
          {step === 1 && (
            <motion.div key="1" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
                <Fingerprint className="mt-0.5 size-4 shrink-0 text-[var(--brand)]" />
                <p className="text-sm text-[var(--text-muted)]">{t("hashNote")}</p>
              </div>
              <ConsentCheckbox
                id="safeword-consent"
                checked={consent}
                onChange={setConsent}
                label={t("consent")}
                linkHref="/legal/privacy"
                linkLabel={t("readPolicy")}
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(0)}>
                  {t("step1")}
                </Button>
                <Button
                  className="flex-1"
                  disabled={setSafeWord.isPending || !consent}
                  onClick={() =>
                    setSafeWord.mutate(
                      { familyLabel: label, phrase },
                      {
                        onSuccess: () => {
                          setFlag("safeWord");
                          setStep(2);
                        },
                      },
                    )
                  }
                >
                  {t("create")}
                </Button>
              </div>
              {setSafeWord.error && (
                <p className="text-xs text-[var(--risk-danger-fg)]">{toApiError(setSafeWord.error).message}</p>
              )}
            </motion.div>
          )}
          {step === 2 && (
            <motion.div
              key="2"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-2 py-4 text-center"
            >
              <CheckCircle2 className="size-12 text-[var(--risk-safe)]" />
              <p className="font-semibold text-[var(--text)]">{t("rotated")}</p>
              <p className="text-xs text-[var(--text-muted)]">{t("hashNote")}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

/* ---------- Verify caller ---------- */

function VerifyCaller({ ownerUserId }: { ownerUserId?: string }) {
  const t = useTranslations("guardian.safeWord");
  const [phrase, setPhrase] = useState("");
  const verify = useVerifyCaller();
  const result = verify.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("verifyTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-[var(--text-muted)]">{t("verifyLead")}</p>
        <Input value={phrase} onChange={(e) => setPhrase(e.target.value)} placeholder="••••••" />
        <Button
          className="w-full"
          disabled={!phrase || !ownerUserId || verify.isPending}
          onClick={() => verify.mutate({ ownerUserId: ownerUserId!, providedPhrase: phrase })}
        >
          {t("verify")}
        </Button>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex items-center gap-2 rounded-lg border p-3 text-sm",
                result.verified
                  ? "border-[var(--risk-safe)] bg-[var(--risk-safe-bg)] text-[var(--risk-safe-fg)]"
                  : "border-[var(--risk-critical)] bg-[var(--risk-critical-bg)] text-[var(--risk-critical-fg)]",
              )}
            >
              {result.verified ? <ShieldCheck className="size-4" /> : <ShieldAlert className="size-4" />}
              <span>
                {result.verified ? t("verified") : t("notVerified")}
                {result.ownerAlerted && ` · ${t("ownerAlerted")}`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
