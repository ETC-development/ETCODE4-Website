import "server-only";
import { supabaseSession } from "@/lib/supabase/session";

export type SoloRow = {
  id: string;
  full_name: string;
  email: string;
  institution: string | null;
  study_year: string | null;
  leetcode: string | null;
  hackerrank: string | null;
  github: string | null;
  motivation: string | null;
  created_at: string;
};

/** Solo free-agents: participants not yet on a team. */
export async function listSolos(): Promise<SoloRow[]> {
  const sb = await supabaseSession();
  const { data } = await sb
    .from("participants")
    .select(
      "id, full_name, email, institution, study_year, leetcode, hackerrank, github, motivation, created_at",
    )
    .is("team_id", null)
    .order("created_at", { ascending: true });
  return (data ?? []) as SoloRow[];
}
