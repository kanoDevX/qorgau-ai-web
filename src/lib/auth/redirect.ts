/** Only same-site paths are allowed after sign-in ("/learn", not "//evil.example" or "https://…"): no open redirect. */
export function safeNext(next: string | null | undefined, fallback = "/check"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
