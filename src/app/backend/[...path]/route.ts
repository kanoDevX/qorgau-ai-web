import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { JWT_COOKIE } from "@/lib/auth/cookies";
import { clientIpHeader, refreshSession } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:5199";

// Headers we forward from the browser to the backend.
const PASSTHROUGH_REQUEST_HEADERS = ["content-type", "idempotency-key", "x-api-key", "accept-language"];

async function proxy(req: NextRequest, path: string[]): Promise<NextResponse> {
  const target = new URL(`/${path.join("/")}`, API_ORIGIN);
  target.search = req.nextUrl.search;

  const headers = new Headers();
  for (const h of PASSTHROUGH_REQUEST_HEADERS) {
    const v = req.headers.get(h);
    if (v) headers.set(h, v);
  }
  for (const [k, v] of Object.entries(clientIpHeader(req))) headers.set(k, v);

  const jar = await cookies();
  let token = jar.get(JWT_COOKIE)?.value;
  // Access token expired (cookie gone) but a refresh token is present: rotate before the call.
  if (!token) token = (await refreshSession(jar)) ?? undefined;
  if (token) headers.set("authorization", `Bearer ${token}`);

  const method = req.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : Buffer.from(await req.arrayBuffer());

  let backendRes: Response;
  try {
    backendRes = await fetch(target, { method, headers, body, redirect: "manual", cache: "no-store" });
    // Token rejected (expired / revoked): rotate once and retry. Replay detection lives on the backend.
    if (backendRes.status === 401 && token) {
      const fresh = await refreshSession(jar);
      if (fresh) {
        headers.set("authorization", `Bearer ${fresh}`);
        backendRes = await fetch(target, { method, headers, body, redirect: "manual", cache: "no-store" });
      }
    }
  } catch {
    return NextResponse.json(
      { title: "Backend unavailable", status: 503, detail: "The QorgauAI API is not reachable." },
      { status: 503 },
    );
  }

  const resHeaders = new Headers();
  const ct = backendRes.headers.get("content-type");
  if (ct) resHeaders.set("content-type", ct);

  return new NextResponse(backendRes.body, { status: backendRes.status, headers: resHeaders });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
