import { Logo } from "@/components/brand/logo";

/** Shared frame for the sign-in, sign-up and password pages: logo, title, lead, then the form. */
export function AuthCard({ title, lead, children }: { title: string; lead?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--bg)] px-4 py-10">
      <main id="main" className="w-full max-w-md">
        <Logo className="mb-8" />
        <h1 className="text-[length:var(--text-title)] text-[var(--text)]">{title}</h1>
        {lead && <p className="mt-2 text-sm text-[var(--text-muted)]">{lead}</p>}
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
