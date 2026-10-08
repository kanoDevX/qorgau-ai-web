import createClient from "openapi-fetch";
import type { paths } from "./schema";

/**
 * Typed API client. Every request goes to the same-origin `/backend/*` route handler
 * (see app/backend/[...path]/route.ts), which injects the JWT from an httpOnly cookie —
 * so the token never touches client JS (XSS-safe) and CSP `connect-src` stays `'self'`.
 */
export const api = createClient<paths>({
  baseUrl: "/backend",
  headers: { Accept: "application/json" },
});

export type ApiPaths = paths;

/** Narrow helper: pull the 200 response body type for an operation path+method. */
export type Ok<
  P extends keyof paths,
  M extends keyof paths[P],
> = paths[P][M] extends { responses: { 200: { content: { "application/json": infer T } } } }
  ? T
  : paths[P][M] extends { responses: { 201: { content: { "application/json": infer T } } } }
    ? T
    : never;

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string | undefined,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Raw fetch for multipart uploads (openapi-fetch is awkward with FormData). */
export async function uploadMultipart<T>(
  path: string,
  form: FormData,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`/backend${path}`, {
    method: "POST",
    body: form,
    ...init,
  });
  if (!res.ok) {
    const problem = await res.json().catch(() => ({}));
    throw new ApiError(res.status, problem.code, problem.detail ?? problem.title ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export function toApiError(error: unknown, fallback = "Request failed"): ApiError {
  if (error instanceof ApiError) return error;
  const problem = error as { status?: number; code?: string; detail?: string; title?: string; message?: string };
  return new ApiError(
    problem?.status ?? 0,
    problem?.code,
    problem?.detail ?? problem?.title ?? problem?.message ?? fallback,
  );
}
