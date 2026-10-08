"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LifeBuoy, LogIn } from "lucide-react";
import { TooltipProvider } from "@/components/ui/primitives";
import { Logo } from "@/components/brand/logo";
import { ConnectionStatus } from "./connection-status";
import { NotificationsDrawer } from "./notifications-drawer";
import { ProfileMenu } from "./profile-menu";
import { ReconsentBanner } from "./reconsent-banner";
import { SiteFooter } from "./site-footer";
import { DensityToggle, LocaleSwitcher, ThemeToggle } from "./theme-controls";
import { navForRole } from "@/lib/nav";
import type { OnboardingRole } from "@/lib/auth/cookies";
import { FraudAlertsProvider, useSharedFraudAlerts } from "@/lib/signalr";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth/session";

export function AppShell(props: { role: OnboardingRole; children: React.ReactNode }) {
  return (
    <FraudAlertsProvider>
      <Shell {...props} />
    </FraudAlertsProvider>
  );
}

/**
 * IA 2.0 (§5.2): five sections in the sidebar (desktop) / bottom bar (mobile). SOS is always visible,
 * the bell opens the notifications drawer, the avatar opens profile / privacy / sign-out.
 */
function Shell({ role, children }: { role: OnboardingRole; children: React.ReactNode }) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const ta = useTranslations("auth");
  const { isAuthenticated, ready } = useSession();
  const pathname = usePathname();
  const items = navForRole(role);
  const { state } = useSharedFraudAlerts();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-dvh bg-[var(--bg)]">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-elevated)] p-4 md:flex">
          <Link href="/" className="mb-4 mt-1 inline-flex px-2" aria-label="QorgauAI">
            <Logo />
          </Link>
          {/* Victims arrive in panic: the emergency flow is never more than one click away. */}
          <Link
            href="/golden-hour"
            className="mb-4 flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--risk-critical)] bg-[var(--risk-critical-bg)] px-3 py-2 text-sm font-semibold text-[var(--risk-critical-fg)] transition-colors hover:brightness-110"
          >
            <LifeBuoy className="size-4" aria-hidden /> {tc("sosShort")}
          </Link>
          <nav aria-label={tc("mainNav")} className="flex flex-1 flex-col gap-0.5">
            {items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
                  )}
                >
                  <item.icon className="size-4" aria-hidden />
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>
          <div className="space-y-3 border-t border-[var(--border)] pt-3">
            <ConnectionStatus state={state} className="px-2" />
            <div className="flex items-center gap-1 px-1">
              <ThemeToggle />
              <DensityToggle />
              <LocaleSwitcher />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header: mobile = logo + SOS + bell + profile; desktop = bell + profile on the right */}
          <header className="sticky top-0 z-40 flex items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--bg-elevated)]/90 px-4 py-2.5 backdrop-blur md:justify-end md:border-b-0 md:bg-transparent md:px-8 md:pt-4 md:backdrop-blur-none">
            <Link href="/" aria-label="QorgauAI" className="md:hidden">
              <Logo />
            </Link>
            <div className="flex items-center gap-1">
              <Link
                href="/golden-hour"
                className="mr-1 inline-flex items-center gap-1 rounded-full border border-[var(--risk-critical)] bg-[var(--risk-critical-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--risk-critical-fg)] md:hidden"
              >
                <LifeBuoy className="size-3.5" aria-hidden /> SOS
                <span className="sr-only"> — {tc("sosTitle")}</span>
              </Link>
              <span className="md:hidden">
                <LocaleSwitcher />
              </span>
              {/* Guests get a visible way in, not only a menu item (shown once the session cookie has been read). */}
              {ready && !isAuthenticated && (
                <Link
                  href={`/login?next=${encodeURIComponent(pathname)}`}
                  className="mr-1 inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)]"
                  data-testid="header-sign-in"
                >
                  <LogIn className="size-4" aria-hidden /> {ta("signIn")}
                </Link>
              )}
              <NotificationsDrawer />
              <ProfileMenu />
            </div>
          </header>

          <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 md:px-8 md:py-4 md:pb-10">
            <ReconsentBanner />
            {children}
          </main>
          <SiteFooter className="mb-16 md:mb-0" />

          {/* Mobile bottom bar — the same five sections, no hidden "More" */}
          <nav
            aria-label={tc("mainNav")}
            className="fixed inset-x-0 bottom-0 z-40 grid border-t border-[var(--border)] bg-[var(--bg-elevated)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
            style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
          >
            {items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium",
                    active ? "text-[var(--brand)]" : "text-[var(--text-muted)]",
                  )}
                >
                  <item.icon className="size-5" aria-hidden />
                  <span className="max-w-full truncate px-0.5">{t(item.key)}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </TooltipProvider>
  );
}
