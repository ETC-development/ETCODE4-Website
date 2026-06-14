// Pure role logic — no server-only deps, so it's unit-testable in isolation.
export type AdminRole = "super_admin" | "manager" | "hr_checkin";

// super_admin > manager > hr_checkin
export const ROLE_RANK: Record<AdminRole, number> = {
  hr_checkin: 1,
  manager: 2,
  super_admin: 3,
};

export function roleAtLeast(role: AdminRole, min: AdminRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}
