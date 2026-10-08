"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, ShieldHalf, User, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import type { OnboardingRole } from "@/lib/auth/cookies";
import { useSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

const ROLES: { role: OnboardingRole; icon: LucideIcon; account: "self" | "guardian" | "reviewer" | "partner" }[] = [
  { role: "self", icon: User, account: "self" },
  { role: "guardian", icon: ShieldHalf, account: "guardian" },
  { role: "partner", icon: Building2, account: "partner" },
];

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const { signInDemo } = useSession();
  const [selected, setSelected] = useState<OnboardingRole>("self");
  const [loading, setLoading] = useState(false);

  async function proceed() {
    setLoading(true);
    const target = ROLES.find((r) => r.role === selected)!;
    try {
      await signInDemo(target.account, selected);
    } catch {
      /* backend down — still route into the app in a read-only demo */
    }
    router.push(selected === "partner" ? "/partner" : "/check");
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-lg">
        <Logo className="mb-8" />
        <h1 className="text-[length:var(--text-title)] text-[var(--text)]">{t("title")}</h1>
        <div className="mt-6 space-y-3">
          {ROLES.map(({ role, icon: Icon }) => (
            <motion.button
              key={role}
              whileTap={{ scale: 0.99 }}
              onClick={() => setSelected(role)}
              className={cn(
                "flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-colors",
                selected === role
                  ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]",
              )}
              aria-pressed={selected === role}
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg",
                  selected === role ? "bg-[var(--brand-solid)] text-[var(--brand-fg)]" : "bg-[var(--surface-2)] text-[var(--text-muted)]",
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block font-semibold text-[var(--text)]">{t(role)}</span>
                <span className="mt-0.5 block text-sm text-[var(--text-muted)]">{t(`${role}Desc`)}</span>
              </span>
            </motion.button>
          ))}
        </div>
        <Button size="lg" className="mt-6 w-full" onClick={proceed} disabled={loading}>
          {t("continue")}
        </Button>
        <div className="mt-4 space-y-2 text-center text-sm">
          <p>
            <Link href="/login" className="text-[var(--brand)] underline underline-offset-2">
              {t("haveAccount")}
            </Link>
          </p>
          <p>
            <Link href="/register" className="text-[var(--text-muted)] underline underline-offset-2">
              {t("orRegister")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
