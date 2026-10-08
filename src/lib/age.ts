/** Mirrors the server rule (User.IsUnder18): year + month only, never the exact date. */
export function isMinor(year: number | null, month: number | null, today = new Date()) {
  if (!year || !month) return false;
  const age = today.getFullYear() - year;
  return age < 18 || (age === 18 && today.getMonth() + 1 < month);
}
