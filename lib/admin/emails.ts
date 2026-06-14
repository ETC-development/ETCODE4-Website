import "server-only";
import { supabaseSession } from "@/lib/supabase/session";
import type { PendingTeam, EmailLogRow } from "./types";

export type { PendingTeam, EmailLogRow };

/**
 * Teams whose decision matches `kind` but who haven't had that email sent yet.
 * acceptance → accepted teams; rejection → rejected teams.
 */
export async function getPending(
  kind: "acceptance" | "rejection",
): Promise<PendingTeam[]> {
  const status = kind === "acceptance" ? "accepted" : "rejected";
  const sb = await supabaseSession();
  const [{ data: teams }, { data: sent }] = await Promise.all([
    sb
      .from("teams")
      .select("id, team_code, name")
      .eq("status", status)
      .order("created_at", { ascending: true }),
    sb.from("emails").select("team_id").eq("template", kind).eq("status", "sent"),
  ]);
  const done = new Set((sent ?? []).map((r) => r.team_id as string));
  return (teams ?? [])
    .filter((t) => !done.has(t.id as string))
    .map((t) => ({ code: t.team_code as string, name: t.name as string }));
}

export async function listEmailLog(limit = 100): Promise<EmailLogRow[]> {
  const sb = await supabaseSession();
  const { data } = await sb
    .from("emails")
    .select(
      "id, template, to_email, status, error, created_at, team:teams(team_code, name)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as EmailLogRow[];
}
