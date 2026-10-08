"use client";

import { useCallback, useEffect, useState } from "react";
import { ROLE_COOKIE, UID_COOKIE, type OnboardingRole } from "./cookies";

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`))
    ?.split("=")[1];
}

export function useSession() {
  const [userId, setUserId] = useState<string | undefined>();
  const [role, setRole] = useState<OnboardingRole>("self");
  // False during server rendering and the first client render: the cookie has not been read yet, so UI that
  // depends on "signed in or not" should wait for this instead of flashing the wrong state.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUserId(readCookie(UID_COOKIE));
    setRole((readCookie(ROLE_COOKIE) as OnboardingRole) ?? "self");
    setReady(true);
  }, []);

  const signInDemo = useCallback(
    async (account: "self" | "guardian" | "reviewer" | "partner" = "self", onboardingRole?: OnboardingRole) => {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "demo", account, onboardingRole }),
      });
      if (!res.ok) throw new Error("sign-in failed");
      const { userId } = (await res.json()) as { userId: string };
      setUserId(userId);
      if (onboardingRole) setRole(onboardingRole);
      return userId;
    },
    [],
  );

  const signOut = useCallback(async () => {
    await fetch("/api/session", { method: "DELETE" });
    setUserId(undefined);
  }, []);

  return { userId, role, ready, isAuthenticated: !!userId, signInDemo, signOut };
}
