import "server-only";
import { redirect } from "next/navigation";
import { supabaseSession } from "@/lib/supabase/session";
import { roleAtLeast, type AdminRole } from "@/lib/roles";

export { roleAtLeast };
export type { AdminRole };

export type Admin = {
  id: string;
  email: string;
  full_name: string | null;
  role: AdminRole;
};

/**
 * The signed-in admin, or null. Reads through the RLS-bound session client:
 * the admins_select policy only returns the caller's own row, so a logged-in
 * auth user who isn't in `admins` resolves to null (not an admin).
 */
export async function getAdmin(): Promise<Admin | null> {
  const sb = await supabaseSession();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;

  const { data } = await sb
    .from("admins")
    .select("id,email,full_name,role")
    .eq("id", user.id)
    .maybeSingle();

  return (data as Admin | null) ?? null;
}

/** Page/layout guard: redirect to login when not an admin. */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/**
 * Page guard: require at least `min`. Insufficient role -> bounced to the
 * admin home (which the role can see). Server actions should use assertRole().
 */
export async function requireRole(min: AdminRole): Promise<Admin> {
  const admin = await requireAdmin();
  if (!roleAtLeast(admin.role, min)) redirect("/admin");
  return admin;
}

export class ForbiddenError extends Error {
  constructor(message = "forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Server-action guard: hard-deny on insufficient role (defense in depth behind
 * RLS). Throws instead of redirecting so callers can map it to a result.
 */
export async function assertRole(min: AdminRole): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin || !roleAtLeast(admin.role, min)) throw new ForbiddenError();
  return admin;
}
