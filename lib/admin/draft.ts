import "server-only";
import { supabaseSession } from "@/lib/supabase/session";

export type SoloRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  institution: string | null;
  study_year: string | null;
  leetcode: string | null;
  hackerrank: string | null;
  github: string | null;
  motivation: string | null;
  tshirt_size: string | null;
  created_at: string;
};

/** Solo free-agents: participants not yet on a team and not rejected. */
export async function listSolos(): Promise<SoloRow[]> {
  const sb = await supabaseSession();
  const { data } = await sb
    .from("participants")
    .select(
      "id, full_name, email, phone, institution, study_year, leetcode, hackerrank, github, motivation, tshirt_size, created_at",
    )
    .is("team_id", null)
    .is("rejected_at", null)
    .order("created_at", { ascending: true });
  return (data ?? []) as SoloRow[];
}

export type PartialTeam = {
  id: string;
  code: string;
  /** Display name: official codename when assigned, else registration name. */
  name: string;
  memberCount: number;
};

/**
 * Teams with an open slot (1–2 members), so a solo can be drafted in to
 * complete them. Rejected teams are excluded; oldest first.
 */
export async function listPartialTeams(): Promise<PartialTeam[]> {
  const sb = await supabaseSession();
  const { data } = await sb
    .from("teams")
    .select("id, team_code, name, assigned_name, status, members:participants(id)")
    .neq("status", "rejected")
    .order("created_at", { ascending: true });
  return (data ?? [])
    .map((t) => ({
      id: t.id as string,
      code: t.team_code as string,
      name: (t.assigned_name as string | null) || (t.name as string),
      memberCount: ((t.members as { id: string }[] | null) ?? []).length,
    }))
    .filter((t) => t.memberCount > 0 && t.memberCount < 3);
}
