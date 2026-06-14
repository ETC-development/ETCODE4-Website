import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { getActiveSession } from "./checkin";

export type BoardCounts = {
  participantsChecked: number;
  participantsTotal: number;
  teamsComplete: number;
  teamsTotal: number;
};

// Full payload: sent once on page load (gives the grid its team list).
export type BoardSnapshot = {
  session: { id: string; label: string } | null;
  counts: BoardCounts;
  teams: { code: string; name: string }[];
  completedCodes: string[];
};

// Lean payload: polled every few seconds — aggregates + which teams are done.
export type BoardTick = {
  session: { id: string; label: string } | null;
  counts: BoardCounts;
  completedCodes: string[];
};

async function compute(): Promise<BoardSnapshot> {
  const db = supabaseServer();
  const session = await getActiveSession(db);

  const { data: accepted } = await db
    .from("teams")
    .select("id, team_code, name, assigned_name")
    .eq("status", "accepted")
    .order("team_code", { ascending: true });
  const teams = (accepted ?? []) as {
    id: string;
    team_code: string;
    name: string;
    assigned_name: string | null;
  }[];

  // official codename on the board when assigned, else the registration name
  const teamList = teams.map((t) => ({
    code: t.team_code,
    name: t.assigned_name || t.name,
  }));
  const teamIds = teams.map((t) => t.id);

  if (teamIds.length === 0) {
    return {
      session: session ? { id: session.id, label: session.label } : null,
      counts: {
        participantsChecked: 0,
        participantsTotal: 0,
        teamsComplete: 0,
        teamsTotal: 0,
      },
      teams: teamList,
      completedCodes: [],
    };
  }

  const { data: parts } = await db
    .from("participants")
    .select("id")
    .in("team_id", teamIds);
  const acceptedPids = new Set((parts ?? []).map((p) => p.id as string));

  let participantsChecked = 0;
  let completedCodes: string[] = [];

  if (session) {
    const { data: checks } = await db
      .from("check_ins")
      .select("participant_id")
      .eq("session_id", session.id);
    participantsChecked = (checks ?? []).filter((c) =>
      acceptedPids.has(c.participant_id as string),
    ).length;

    const { data: completeRows } = await db
      .from("team_checkins")
      .select("team_id")
      .eq("session_id", session.id)
      .in("team_id", teamIds);
    const completeIds = new Set((completeRows ?? []).map((r) => r.team_id as string));
    completedCodes = teams
      .filter((t) => completeIds.has(t.id))
      .map((t) => t.team_code);
  }

  return {
    session: session ? { id: session.id, label: session.label } : null,
    counts: {
      participantsChecked,
      participantsTotal: acceptedPids.size,
      teamsComplete: completedCodes.length,
      teamsTotal: teams.length,
    },
    teams: teamList,
    completedCodes,
  };
}

export async function getBoardSnapshot(): Promise<BoardSnapshot> {
  return compute();
}

export async function getBoardTick(): Promise<BoardTick> {
  const { session, counts, completedCodes } = await compute();
  return { session, counts, completedCodes };
}
