/**
 * Cookie consent state. Stored in one first-party cookie (`qorgau_consent`, 180 days):
 *   v1.<preferences 0|1>.<analytics 0|1>
 * "Necessary" is always on and not stored. Authenticated users additionally get the choice
 * mirrored to the server (ConsentGrant) — see syncConsentToServer.
 */
export const CONSENT_COOKIE = "qorgau_consent";
const MAX_AGE = 60 * 60 * 24 * 180;
export const CONSENT_EVENT = "qorgau:consent-changed";
export const OPEN_SETTINGS_EVENT = "qorgau:open-cookie-settings";

export interface ConsentState {
  preferences: boolean;
  analytics: boolean;
}

export function parseConsent(raw: string | undefined): ConsentState | null {
  if (!raw) return null;
  const [v, p, a] = decodeURIComponent(raw).split(".");
  if (v !== "v1" || (p !== "0" && p !== "1") || (a !== "0" && a !== "1")) return null;
  return { preferences: p === "1", analytics: a === "1" };
}

function readRaw(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function readConsent(): ConsentState | null {
  return parseConsent(readRaw(CONSENT_COOKIE));
}

export function writeConsent(state: ConsentState): void {
  const value = `v1.${state.preferences ? 1 : 0}.${state.analytics ? 1 : 0}`;
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${MAX_AGE}; samesite=lax`;
  document.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: state }));
  void syncConsentToServer(state);
}

/**
 * Preference cookies (language, density) are written only on an explicit user action.
 * With "Preferences" consent they persist for a year; without it they are session cookies.
 */
export function setPreferenceCookie(name: string, value: string): void {
  const persist = readConsent()?.preferences === true;
  document.cookie = `${name}=${value}; path=/; samesite=lax${persist ? `; max-age=${60 * 60 * 24 * 365}` : ""}`;
}

/** Best effort: only does something when the visitor is signed in (uid cookie present). */
export async function syncConsentToServer(state: ConsentState): Promise<void> {
  if (!readRaw("qorgau_uid")) return;
  try {
    await Promise.all(
      (
        [
          ["PreferenceCookies", state.preferences],
          ["AnalyticsCookies", state.analytics],
        ] as const
      ).map(([scope, granted]) =>
        fetch("/backend/api/v1/me/consents", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ scope, granted }),
        }),
      ),
    );
  } catch {
    /* offline — the cookie remains the source of truth for this browser */
  }
}
