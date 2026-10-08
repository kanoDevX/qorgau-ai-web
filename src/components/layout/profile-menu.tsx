"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LockKeyhole, LogIn, LogOut, Settings, UserPlus, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth/session";

/** Avatar → profile/settings, privacy, sign in/out (§5.2). A disclosure menu, closes on Esc / outside click. */
export function ProfileMenu() {
  const t = useTranslations("profileMenu");
  const router = useRouter();
  const { isAuthenticated, signOut } = useSession();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const item =
    "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[var(--text)] hover:bg-[var(--surface-2)] focus-visible:bg-[var(--surface-2)]";

  return (
    <div className="relative" ref={rootRef}>
      <Button variant="ghost" size="icon" aria-label={t("open")} aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((o) => !o)}>
        <UserRound className="size-4" aria-hidden />
      </Button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-56 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-[var(--bg-elevated)] py-1 shadow-[var(--shadow-pop)]">
          <Link href="/settings" className={item} onClick={() => setOpen(false)}>
            <Settings className="size-4 text-[var(--text-muted)]" aria-hidden /> {t("settings")}
          </Link>
          <Link href="/settings/notifications" className={item} onClick={() => setOpen(false)}>
            <Bell className="size-4 text-[var(--text-muted)]" aria-hidden /> {t("notifications")}
          </Link>
          <Link href="/settings/privacy" className={item} onClick={() => setOpen(false)}>
            <LockKeyhole className="size-4 text-[var(--text-muted)]" aria-hidden /> {t("privacy")}
          </Link>
          <div className="my-1 border-t border-[var(--border)]" />
          {isAuthenticated ? (
            <button
              type="button"
              className={item}
              onClick={async () => {
                setOpen(false);
                await signOut();
                router.push("/");
              }}
            >
              <LogOut className="size-4 text-[var(--text-muted)]" aria-hidden /> {t("signOut")}
            </button>
          ) : (
            <>
              <Link href="/login" className={item} onClick={() => setOpen(false)}>
                <LogIn className="size-4 text-[var(--text-muted)]" aria-hidden /> {t("signIn")}
              </Link>
              <Link href="/register" className={item} onClick={() => setOpen(false)}>
                <UserPlus className="size-4 text-[var(--text-muted)]" aria-hidden /> {t("register")}
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
