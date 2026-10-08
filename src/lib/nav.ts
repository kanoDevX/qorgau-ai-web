import {
  Bell,
  Building2,
  Database,
  Gavel,
  Map as MapIcon,
  TrendingUp,
  GraduationCap,
  House,
  LifeBuoy,
  LockKeyhole,
  Network,
  Radar,
  ReceiptText,
  ScanSearch,
  PhoneIncoming,
  Settings,
  SwatchBook,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { OnboardingRole } from "./auth/cookies";

export interface NavItem {
  href: string;
  key: string; // i18n key under "nav"
  icon: LucideIcon;
  roles?: OnboardingRole[]; // undefined = all
}

/**
 * Information architecture 2.0 (§5.2): at most five primary sections, identical on the mobile
 * bottom bar and the desktop sidebar. SOS, notifications (drawer) and the profile menu live in the
 * header. Every section has its own icon.
 */
export const NAV: NavItem[] = [
  { href: "/check", key: "check", icon: ScanSearch },
  { href: "/dashboard", key: "home", icon: House, roles: ["self", "guardian"] },
  { href: "/partner", key: "partner", icon: Building2, roles: ["partner"] },
  { href: "/radar", key: "radar", icon: Radar },
  { href: "/learn", key: "learn", icon: GraduationCap, roles: ["self", "guardian"] },
  { href: "/family", key: "family", icon: Users, roles: ["self", "guardian"] },
];

export const COMMAND_ACTIONS: { href: string; key: string; icon: LucideIcon }[] = [
  { href: "/check", key: "check", icon: ScanSearch },
  { href: "/check?mode=call", key: "callMode", icon: PhoneIncoming },
  { href: "/check?mode=transfer", key: "secondOpinion", icon: Wallet },
  { href: "/dashboard", key: "home", icon: House },
  { href: "/radar", key: "radar", icon: Radar },
  { href: "/radar?tab=network", key: "networks", icon: Network },
  { href: "/learn", key: "learn", icon: GraduationCap },
  { href: "/family", key: "family", icon: Users },
  { href: "/golden-hour", key: "goldenHour", icon: LifeBuoy },
  { href: "/settings", key: "settings", icon: Settings },
  { href: "/settings/privacy", key: "privacy", icon: LockKeyhole },
  { href: "/settings/notifications", key: "notifySettings", icon: Bell },
  { href: "/radar?tab=map", key: "threatMap", icon: MapIcon },
  { href: "/radar?tab=trends", key: "trends", icon: TrendingUp },
  { href: "/open-data", key: "openData", icon: Database },
  { href: "/admin/moderation", key: "moderation", icon: Gavel },
  { href: "/pricing", key: "pricing", icon: ReceiptText },
  { href: "/partner", key: "partner", icon: Building2 },
  ...(process.env.NODE_ENV !== "production" ? [{ href: "/design-system", key: "designSystem", icon: SwatchBook }] : []),
];

export function navForRole(role: OnboardingRole | undefined): NavItem[] {
  const r = role ?? "self";
  return NAV.filter((n) => !n.roles || n.roles.includes(r));
}
