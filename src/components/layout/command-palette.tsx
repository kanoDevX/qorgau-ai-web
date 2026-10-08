"use client";

import { Command } from "cmdk";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { COMMAND_ACTIONS } from "@/lib/nav";

/** Cmd/Ctrl+K anywhere — instant access to any action for power users (partners, analysts). */
export function CommandPalette() {
  const t = useTranslations("nav");
  const tc = useTranslations("palette");
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label={tc("label")}
      className="fixed inset-0 z-[100] flex items-start justify-center bg-[var(--scrim)] p-4 pt-[15vh] backdrop-blur-sm data-[state=closed]:hidden"
      onClick={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[var(--shadow-pop)]">
        <Command.Input
          placeholder={tc("placeholder")}
          className="w-full border-b border-[var(--border)] bg-transparent px-4 py-3.5 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-subtle)]"
        />
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-sm text-[var(--text-subtle)]">
            {tc("empty")}
          </Command.Empty>
          <Command.Group>
            {COMMAND_ACTIONS.map((a) => (
              <Command.Item
                key={a.href + a.key}
                value={t(a.key)}
                onSelect={() => {
                  router.push(a.href);
                  setOpen(false);
                }}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--text)] data-[selected=true]:bg-[var(--brand-soft)] data-[selected=true]:text-[var(--brand)]"
              >
                <a.icon className="size-4" aria-hidden />
                {t(a.key)}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
