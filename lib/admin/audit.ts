import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseSession } from "@/lib/supabase/session";

export type AuditEntry = {
  id: string;
  action: string;
  target: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
  actor: string; // resolved admin name/email, or "unknown"
};

/** Recent audit entries with the acting admin's name resolved (managers+). */
export async function listAuditLog(limit = 200): Promise<AuditEntry[]> {
  const sb = await supabaseSession();
  const [{ data: rows }, { data: admins }] = await Promise.all([
    sb
      .from("audit_log")
      .select("id, admin_id, action, target, meta, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
    sb.from("admins").select("id, full_name, email"),
  ]);
  const names = new Map<string, string>();
  for (const a of (admins ?? []) as { id: string; full_name: string | null; email: string }[])
    names.set(a.id, a.full_name || a.email);

  return ((rows ?? []) as {
    id: string;
    admin_id: string | null;
    action: string;
    target: string | null;
    meta: Record<string, unknown> | null;
    created_at: string;
  }[]).map((r) => ({
    id: r.id,
    action: r.action,
    target: r.target,
    meta: r.meta,
    created_at: r.created_at,
    actor: (r.admin_id && names.get(r.admin_id)) || "unknown",
  }));
}

/**
 * Append an audit entry. Uses the service-role client (RLS bypass) and is
 * intentionally best-effort: an audit write must never fail the action it
 * records. Caller passes the acting admin's id (resolved via assertRole).
 */
export async function logAudit(
  adminId: string,
  action: string,
  target: string | null,
  meta?: Record<string, unknown>,
): Promise<void> {
  try {
    const db = supabaseServer();
    await db.from("audit_log").insert({
      admin_id: adminId,
      action,
      target,
      meta: meta ?? null,
    });
  } catch {
    // swallow — never block the primary action on logging
  }
}
