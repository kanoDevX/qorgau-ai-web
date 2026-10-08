"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Activity, BookOpen, KeyRound, ReceiptText, Webhook, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PartnerGate } from "@/components/partner/partner-common";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { href: "/partner", key: "overview", icon: Activity },
  { href: "/partner/usage", key: "usage", icon: BarChart3 },
  { href: "/partner/keys", key: "keys", icon: KeyRound },
  { href: "/partner/webhooks", key: "webhooks", icon: Webhook },
  { href: "/partner/billing", key: "billing", icon: ReceiptText },
  { href: "/partner/docs", key: "docs", icon: BookOpen },
] as const;

/**
 * Partner cabinet layout (§5.2: a separate /partner/* area). Pattern: Stripe Dashboard's developer
 * section — keys, webhooks and usage side by side, test vs live made explicit on every key.
 */
export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("partner");
  const pathname = usePathname();

  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <nav aria-label={t("navLabel")} className="mb-6 flex max-w-full flex-wrap gap-1.5 border-b border-[var(--border)] pb-3">
        {SECTIONS.map(({ href, key, icon: Icon }) => {
          const active = href === "/partner" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                active ? "bg-[var(--brand-soft)] text-[var(--brand)]" : "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
              )}
            >
              <Icon className="size-4" aria-hidden /> {t(`nav.${key}`)}
            </Link>
          );
        })}
      </nav>
      {/* Docs are readable before signing up; everything else needs the partner account. */}
      {pathname.startsWith("/partner/docs") ? children : <PartnerGate>{children}</PartnerGate>}
    </>
  );
}
