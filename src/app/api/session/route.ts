import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { REFRESH_COOKIE, ROLE_COOKIE } from "@/lib/auth/cookies";
import { API_ORIGIN, clearSessionCookies, clientIpHeader, setSessionCookies, type TokenResponse } from "@/lib/auth/server-session";
import { CONSENT_COOKIE, parseConsent } from "@/lib/consent";

// Seeded demo accounts (see backend DemoDataSeeder). The backend serves dev-token only in Development (P5).
const DEMO_ACCOUNTS = {
  self: { email: "aigul.retiree@example.kz", roles: ["User"] },
  guardian: { email: "berik.parent@example.kz", roles: ["User"] },
  reviewer: { email: "reviewer@qorgau.ai", roles: ["User", "Reviewer"] },
  partner: { email: "partner@demo-marketplace.example", roles: ["User"] },
} as const;

type Body =
  | { mode: "demo"; account?: keyof typeof DEMO_ACCOUNTS; onboardingRole?: string }
  | { mode: "login"; email: string; password: string; remember?: boolean; onboardingRole?: string }
  | {
      mode: "register";
      email: string;
      displayName: string;
      track: string;
      phone?: string;
      password: string;
      acceptedPolicy: boolean;
      remember?: boolean;
      onboardingRole?: string;
    };

export async function POST(request: Request) {
  const body = (await request.json()) as Body;

  let backendPath: string;
  let payload: unknown;

  if (body.mode === "register") {
    backendPath = "/api/v1/auth/register";
    payload = {
      email: body.email,
      displayName: body.displayName,
      track: body.track,
      phone: body.phone,
      password: body.password,
      acceptedPolicy: body.acceptedPolicy === true,
    };
  } else if (body.mode === "login") {
    backendPath = "/api/v1/auth/login";
    payload = { email: body.email, password: body.password };
  } else {
    backendPath = "/api/v1/auth/dev-token";
    payload = DEMO_ACCOUNTS[body.account ?? "self"];
  }

  const res = await fetch(new URL(backendPath, API_ORIGIN), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      // Lets the backend label the session ("Chrome · Windows") in the devices list.
      "user-agent": request.headers.get("user-agent") ?? "",
      // The visitor's address, so per-IP limits and consent records are per person, not per web server.
      ...clientIpHeader(request),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  }).catch(() => null);

  if (!res || !res.ok) {
    // Pass the backend's problem details (code, retryAfterSeconds) straight through for the form to explain.
    const problem = res ? await res.json().catch(() => ({})) : { code: "backend.unreachable" };
    const headers = new Headers();
    const retryAfter = res?.headers.get("retry-after");
    if (retryAfter) headers.set("retry-after", retryAfter);
    return NextResponse.json({ title: "Sign-in failed", ...problem }, { status: res?.status ?? 503, headers });
  }

  const token = (await res.json()) as TokenResponse;
  const jar = await cookies();
  setSessionCookies(jar, token, body.mode === "demo" ? true : body.remember !== false);

  if (body.onboardingRole) {
    // Role is a preference cookie: persists only with the visitor's "Preferences" consent, else session-only.
    const persist = parseConsent(jar.get(CONSENT_COOKIE)?.value)?.preferences === true;
    jar.set(ROLE_COOKIE, body.onboardingRole, {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      ...(persist ? { maxAge: 60 * 60 * 24 * 30 } : {}),
    });
  }

  return NextResponse.json({ userId: token.userId });
}

/** Sign out: revoke the session server-side (refresh family), then drop the cookies. */
export async function DELETE() {
  const jar = await cookies();
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    await fetch(new URL("/api/v1/auth/logout", API_ORIGIN), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    }).catch(() => null);
  }
  clearSessionCookies(jar);
  return NextResponse.json({ ok: true });
}
