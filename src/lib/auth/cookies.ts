export const JWT_COOKIE = "qorgau_jwt";
export const UID_COOKIE = "qorgau_uid";
export const REFRESH_COOKIE = "qorgau_refresh";
export const ROLE_COOKIE = "qorgau_role";
/** "1" = keep me signed in (persistent cookies); "0" = until the browser closes. */
export const REMEMBER_COOKIE = "qorgau_remember";
export const LOCALE_COOKIE = "qorgau_locale";

export type OnboardingRole = "self" | "guardian" | "partner";
