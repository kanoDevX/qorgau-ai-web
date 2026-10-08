import { createHash } from "node:crypto";
import type { cookies } from "next/headers";
import { JWT_COOKIE, REFRESH_COOKIE, REMEMBER_COOKIE, UID_COOKIE } from "./cookies";

type Jar = Awaited<ReturnType<typeof cookies>>;

export const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:5199";

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  userId: string;
}

const REFRESH_MAX_AGE = 60 * 60 * 24 * 14; // matches RefreshTokenService.Lifetime

/**
 * The visitor's IP for the API (which trusts X-Forwarded-For only from this server — see ForwardedHeaders in
 * the API). Next sets x-forwarded-for on incoming requests; only its first (client) entry is passed on.
 */
export function clientIpHeader(request: Request): Record<string, string> {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim();
  return ip ? { "x-forwarded-for": ip } : {};
}

/**
 * Both tokens live in httpOnly cookies — client JS never sees them. The access token is short-lived;
 * the refresh token is rotated on every use (the backend detects replay and revokes the session).
 *
 * `remember`: true keeps the session for 14 days; false makes the refresh token a browser-session cookie
 * (gone when the browser closes — the right choice on a shared computer). When omitted (token rotation),
 * the choice made at sign-in is kept via the REMEMBER_COOKIE flag.
 */
export function setSessionCookies(jar: Jar, token: TokenResponse, remember?: boolean): void {
  const secure = process.env.NODE_ENV === "production";
  const persist = remember ?? jar.get(REMEMBER_COOKIE)?.value !== "0";
  const keep = persist ? { maxAge: REFRESH_MAX_AGE } : {};
  const accessMaxAge = Math.max(60, Math.floor((new Date(token.expiresAt).getTime() - Date.now()) / 1000));
  jar.set(JWT_COOKIE, token.accessToken, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: accessMaxAge });
  jar.set(REFRESH_COOKIE, token.refreshToken, { httpOnly: true, sameSite: "strict", secure, path: "/", ...keep });
  jar.set(UID_COOKIE, token.userId, { sameSite: "lax", secure, path: "/", ...keep });
  jar.set(REMEMBER_COOKIE, persist ? "1" : "0", { httpOnly: true, sameSite: "strict", secure, path: "/", ...keep });
}

export function clearSessionCookies(jar: Jar): void {
  jar.delete(JWT_COOKIE);
  jar.delete(REFRESH_COOKIE);
  jar.delete(UID_COOKIE);
  jar.delete(REMEMBER_COOKIE);
}

type RefreshOutcome = { token: TokenResponse | null; unauthorized: boolean };

/**
 * In-flight and just-finished rotations, keyed by a hash of the refresh token. A page fires several
 * /backend calls at once; without this, each would rotate the same refresh token and the backend
 * would see the 2nd–nth as token reuse and revoke the whole session. Requests that were sent with the
 * old cookie shortly after the rotation (before the browser stored the new one) get the same successor.
 */
const rotations = new Map<string, { at: number; outcome: Promise<RefreshOutcome> }>();
const SHARE_MS = 30_000;

async function rotate(refreshToken: string): Promise<RefreshOutcome> {
  const res = await fetch(new URL("/api/v1/auth/refresh", API_ORIGIN), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  }).catch(() => null);
  if (!res?.ok) return { token: null, unauthorized: res?.status === 401 };
  return { token: (await res.json()) as TokenResponse, unauthorized: false };
}

/** Rotates the refresh token. Returns the new access token, or null when the session is gone. */
export async function refreshSession(jar: Jar): Promise<string | null> {
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return null;

  const key = createHash("sha256").update(refreshToken).digest("hex");
  const now = Date.now();
  for (const [k, v] of rotations) if (now - v.at > SHARE_MS) rotations.delete(k);
  let entry = rotations.get(key);
  if (!entry) {
    entry = { at: now, outcome: rotate(refreshToken) };
    rotations.set(key, entry);
  }

  const { token, unauthorized } = await entry.outcome;
  if (!token) {
    rotations.delete(key);
    if (unauthorized) clearSessionCookies(jar);
    return null;
  }
  setSessionCookies(jar, token);
  return token.accessToken;
}
