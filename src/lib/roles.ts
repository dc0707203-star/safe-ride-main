export type AppRole = "admin" | "student" | "driver" | "pnp" | "rescue" | "rescue_admin";

/**
 * Resolve a single primary role from a set of roles.
 * Priority: admin > rescue_admin > pnp > rescue > driver > student
 */
export function resolvePrimaryRole(roles: Array<AppRole | null | undefined> | null | undefined): AppRole | null {
  const set = new Set((roles ?? []).filter(Boolean) as AppRole[]);
  if (set.has("admin")) return "admin";
  if (set.has("rescue_admin")) return "rescue_admin";
  if (set.has("pnp")) return "pnp";
  if (set.has("rescue")) return "rescue";
  if (set.has("driver")) return "driver";
  if (set.has("student")) return "student";
  return null;
}
