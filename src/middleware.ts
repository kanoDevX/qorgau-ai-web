import { NextResponse, type NextRequest } from "next/server";
import { buildCsp } from "@/lib/csp";

const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:5199";

/** Issues a fresh nonce per request and passes it to Next (which stamps it on its own scripts) via the request headers. */
export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp({ nonce, dev: process.env.NODE_ENV !== "production", apiOrigin: API_ORIGIN });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|icons/|favicon.ico|sw.js|manifest.webmanifest|_e2e/).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
