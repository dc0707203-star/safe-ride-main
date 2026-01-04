export type AppRole = "admin" | "student" | "driver";

/**
 * Resolve a single primary role from a set of roles.
 * Priority: admin > driver > student
 */
export function resolvePrimaryRole(roles: Array<AppRole | null | undefined> | null | undefined): AppRole | null {
  const set = new Set((roles ?? []).filter(Boolean) as AppRole[]);
  if (set.has("admin")) return "admin";
  if (set.has("driver")) return "driver";
  if (set.has("student")) return "student";
  return null;
}
