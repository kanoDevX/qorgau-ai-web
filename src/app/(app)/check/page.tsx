import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CheckModes } from "@/components/check/check-modes";
import { ScamPatterns } from "@/components/check/scam-patterns";

/** "Check" is the single entry point for every kind of input and situation (§5.2). */
export default async function CheckPage() {
  const t = await getTranslations("check");
  const tc = await getTranslations("common");

  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <Suspense>
        <CheckModes />
      </Suspense>
      <p className="mt-4 flex items-center gap-1.5 text-xs text-[var(--text-subtle)]">
        <ShieldCheck className="size-3.5" aria-hidden /> {tc("encryptedNote")}
      </p>
      <div className="mt-10 max-w-2xl">
        <ScamPatterns />
      </div>
    </>
  );
}
