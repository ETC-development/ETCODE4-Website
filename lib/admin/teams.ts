import "server-only";
import { supabaseSession } from "@/lib/supabase/session";
import type {
  AdminLite,
  EmailRecord,
  RosterMember,
  TeamRecord,
} from "./types";

const MEMBER_COLS =
  "id, role, full_name, email, phone, institution, study_year, leetcode, hackerrank, github, motivation, tshirt_size";

const TEAM_COLS =
  `id, team_code, name, assigned_name, created_at, status, flagged, reviewed_at, reviewed_by, decision_note, internal_note, members:participants(${MEMBER_COLS})`;

/**
 * Official names already assigned to other teams (for the assignment dropdown).
 * Pass the current team's id to exclude its own name so it stays selectable.
 */
export async function takenTeamNames(exceptTeamId?: string): Promise<string[]> {
  const sb = await supabaseSession();
  let q = sb.from("teams").select("id, assigned_name").not("assigned_name", "is", null);
  if (exceptTeamId) q = q.neq("id", exceptTeamId);
  const { data } = await q;
  return (data ?? [])
    .map((t) => t.assigned_name as string | null)
    .filter((n): n is string => Boolean(n));
}

function sortRoster(members: RosterMember[]): RosterMember[] {
  const rank = { leader: 0, member: 1, solo: 2 } as const;
  return [...members].sort((a, b) => rank[a.role] - rank[b.role]);
}

/**
 * All teams with their rosters, read through the RLS-bound session client
 * (managers+ only). Newest first; the queue does the rest of the filtering
 * client-side over this set (small N for one event).
 */
export async function listTeams(): Promise<TeamRecord[]> {
  const sb = await supabaseSession();
  const { data, error } = await sb
    .from("teams")
    .select(TEAM_COLS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((t) => ({
    ...(t as TeamRecord),
    members: sortRoster((t as TeamRecord).members ?? []),
  }));
}

/**
 * Accepted teams only, for the roster-management page. Same shape as
 * listTeams (RLS-bound session client, roster sorted), newest first.
 */
export async function listAcceptedTeams(): Promise<TeamRecord[]> {
  const sb = await supabaseSession();
  const { data, error } = await sb
    .from("teams")
    .select(TEAM_COLS)
    .eq("status", "accepted")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((t) => ({
    ...(t as TeamRecord),
    members: sortRoster((t as TeamRecord).members ?? []),
  }));
}

export async function getTeamByCode(code: string): Promise<TeamRecord | null> {
  const sb = await supabaseSession();
  const { data, error } = await sb
    .from("teams")
    .select(TEAM_COLS)
    .eq("team_code", code.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const t = data as TeamRecord;
  return { ...t, members: sortRoster(t.members ?? []) };
}

/** Directory of admins for attribution (managers+ can read all rows). */
export async function adminDirectory(): Promise<Map<string, AdminLite>> {
  const sb = await supabaseSession();
  const { data } = await sb.from("admins").select("id, full_name, email");
  const map = new Map<string, AdminLite>();
  for (const a of (data ?? []) as AdminLite[]) map.set(a.id, a);
  return map;
}

/** Email history for one team (empty until the email phase ships). */
export async function teamEmails(teamId: string): Promise<EmailRecord[]> {
  const sb = await supabaseSession();
  const { data } = await sb
    .from("emails")
    .select("id, template, to_email, status, error, created_at")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });
  return (data ?? []) as EmailRecord[];
}
