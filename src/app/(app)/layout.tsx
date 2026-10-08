import { cookies } from "next/headers";
import { AppShell } from "@/components/layout/app-shell";
import { ROLE_COOKIE, type OnboardingRole } from "@/lib/auth/cookies";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const role = ((await cookies()).get(ROLE_COOKIE)?.value ?? "self") as OnboardingRole;
  return <AppShell role={role}>{children}</AppShell>;
}
