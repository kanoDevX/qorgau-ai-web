"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/** Shown instead of an endless loading state when a page needs an account and the visitor is signed out. */
export function SignInPrompt({ title }: { title?: string }) {
  const t = useTranslations("auth");
  const pathname = usePathname();
  const next = encodeURIComponent(pathname);
  return (
    <Card className="max-w-lg p-6" data-testid="sign-in-prompt">
      <p className="flex items-center gap-2 font-semibold text-[var(--text)]">
        <LogIn className="size-4 text-[var(--brand)]" aria-hidden /> {title ?? t("signInTitle")}
      </p>
      <p className="mt-1 text-sm text-[var(--text-muted)]">{t("signInLead")}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild>
          <Link href={`/login?next=${next}`}>{t("signIn")}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/register?next=${next}`}>{t("createAccount")}</Link>
        </Button>
      </div>
    </Card>
  );
}
