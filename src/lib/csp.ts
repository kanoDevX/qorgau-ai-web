/**
 * Content-Security-Policy builder (§4.1). Production: scripts run only with the per-request nonce
 * ('strict-dynamic' lets Next's own chunk loader load the rest); no 'unsafe-inline' and no eval for
 * scripts. Dev keeps eval/inline because React refresh needs them. Styles stay 'unsafe-inline': Tailwind
 * is static, but framer-motion and Radix write style attributes at runtime.
 */
export function buildCsp({ nonce, dev, apiOrigin }: { nonce: string; dev: boolean; apiOrigin: string }): string {
  const ws = apiOrigin.replace(/^http/, "ws");
  const script = dev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`;
  return [
    "default-src 'self'",
    script,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    // 'self' covers the /backend/* proxy for REST; the raw origins are only for the SignalR hub.
    `connect-src 'self' ${apiOrigin} ${ws}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}
