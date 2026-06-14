import "server-only";
import { supabaseSession } from "@/lib/supabase/session";
import { STUDY_YEARS, TSHIRT_SIZES } from "@/lib/schema";
import type { TeamStatus } from "./types";

export type RegPoint = { date: string; label: string; daily: number; cumulative: number };
export type Cat = { name: string; value: number };

export type DashboardData = {
  kpis: {
    totalTeams: number;
    totalParticipants: number;
    pending: number;
    accepted: number;
    waitlisted: number;
    rejected: number;
    soloFreeAgents: number;
    capacityFillPct: number | null;
    maxTeams: number | null;
  };
  statusCounts: Record<TeamStatus, number>;
  completeness: { full: number; partial: number; solos: number };
  registrations: RegPoint[];
  institutions: Cat[];
  studyYears: Cat[];
  tshirts: Cat[];
  needsAttention: {
    flagged: { code: string; name: string; status: TeamStatus }[];
    partial: { code: string; name: string; members: number }[];
  };
};

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Africa/Algiers",
});
const dayLabelFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "Africa/Algiers",
});

export async function getDashboardData(): Promise<DashboardData> {
  const sb = await supabaseSession();

  const [{ data: teams }, partsTotal, solosTotal, { data: settings }, { data: people }] =
    await Promise.all([
      sb
        .from("teams")
        .select("team_code, name, status, created_at, flagged, members:participants(id)")
        .order("created_at", { ascending: true }),
      sb.from("participants").select("id", { count: "exact", head: true }),
      sb
        .from("participants")
        .select("id", { count: "exact", head: true })
        .is("team_id", null),
      sb.from("settings").select("max_teams").eq("id", 1).maybeSingle(),
      sb.from("participants").select("institution, study_year, tshirt_size"),
    ]);

  const rows = (teams ?? []) as {
    team_code: string;
    name: string;
    status: TeamStatus;
    created_at: string;
    flagged: boolean;
    members: { id: string }[];
  }[];

  const statusCounts: Record<TeamStatus, number> = {
    pending: 0,
    accepted: 0,
    waitlisted: 0,
    rejected: 0,
  };
  let full = 0;
  let partial = 0;
  for (const t of rows) {
    statusCounts[t.status]++;
    if ((t.members?.length ?? 0) >= 3) full++;
    else partial++;
  }

  // registrations over time (by team created_at, bucketed by event-local day)
  const byDay = new Map<string, number>();
  for (const t of rows) {
    const key = dayKeyFmt.format(new Date(t.created_at));
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  const registrations: RegPoint[] = [];
  let cumulative = 0;
  for (const key of [...byDay.keys()].sort()) {
    const daily = byDay.get(key)!;
    cumulative += daily;
    registrations.push({
      date: key,
      label: dayLabelFmt.format(new Date(`${key}T12:00:00`)),
      daily,
      cumulative,
    });
  }

  // participant breakdowns (all participants, incl. solos)
  const persons = (people ?? []) as {
    institution: string | null;
    study_year: string | null;
    tshirt_size: string | null;
  }[];
  const instMap = new Map<string, number>();
  const yearMap = new Map<string, number>();
  const shirtMap = new Map<string, number>();
  for (const p of persons) {
    if (p.institution) instMap.set(p.institution, (instMap.get(p.institution) ?? 0) + 1);
    if (p.study_year) yearMap.set(p.study_year, (yearMap.get(p.study_year) ?? 0) + 1);
    if (p.tshirt_size) shirtMap.set(p.tshirt_size, (shirtMap.get(p.tshirt_size) ?? 0) + 1);
  }
  const institutions: Cat[] = [...instMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  const studyYears: Cat[] = STUDY_YEARS.map((y) => ({
    name: y,
    value: yearMap.get(y) ?? 0,
  })).filter((c) => c.value > 0);
  const tshirts: Cat[] = TSHIRT_SIZES.map((s) => ({
    name: s,
    value: shirtMap.get(s) ?? 0,
  })).filter((c) => c.value > 0);

  // needs-attention rail: flagged teams + still-pending partial rosters
  const flaggedTeams = rows
    .filter((t) => t.flagged)
    .slice(0, 12)
    .map((t) => ({ code: t.team_code, name: t.name, status: t.status }));
  const partialTeams = rows
    .filter((t) => t.status === "pending" && (t.members?.length ?? 0) < 3)
    .slice(0, 12)
    .map((t) => ({
      code: t.team_code,
      name: t.name,
      members: t.members?.length ?? 0,
    }));

  const maxTeams = (settings?.max_teams as number | null) ?? null;
  const solos = solosTotal.count ?? 0;

  return {
    kpis: {
      totalTeams: rows.length,
      totalParticipants: partsTotal.count ?? 0,
      pending: statusCounts.pending,
      accepted: statusCounts.accepted,
      waitlisted: statusCounts.waitlisted,
      rejected: statusCounts.rejected,
      soloFreeAgents: solos,
      capacityFillPct:
        maxTeams && maxTeams > 0
          ? Math.round((statusCounts.accepted / maxTeams) * 100)
          : null,
      maxTeams,
    },
    statusCounts,
    completeness: { full, partial, solos },
    registrations,
    institutions,
    studyYears,
    tshirts,
    needsAttention: { flagged: flaggedTeams, partial: partialTeams },
  };
}
