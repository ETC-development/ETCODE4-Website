import "server-only";
import { supabaseServer } from "@/lib/supabase/server";

export type CheckinSession = {
  id: string;
  label: string;
  kind: string;
  starts_at: string | null;
  is_active: boolean;
  sort: number;
};

export type CheckinState = {
  session: CheckinSession | null;
  counts: {
    participantsChecked: number;
    participantsTotal: number;
    teamsComplete: number;
    teamsTotal: number;
  };
};

export type ScanResult =
  | {
      ok: true;
      member: { name: string; teamName: string | null; teamCode: string | null };
      progress: { checked: number; total: number } | null;
      teamComplete: boolean;
      already: boolean;
    }
  | { ok: false; error: ScanError };

export type ScanError =
  | "no_active_session"
  | "unknown_qr"
  | "revoked"
  | "not_found"
  | "not_accepted"
  | "failed";

export type RosterSearchMember = {
  id: string;
  name: string;
  role: string;
  checked: boolean;
};
export type RosterSearchTeam = {
  code: string;
  name: string;
  status: string;
  members: RosterSearchMember[];
};

type DB = ReturnType<typeof supabaseServer>;

export async function getActiveSession(db: DB): Promise<CheckinSession | null> {
  const { data } = await db
    .from("checkin_sessions")
    .select("*")
    .eq("is_active", true)
    .order("sort", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data as CheckinSession | null) ?? null;
}

export async function listSessions(): Promise<CheckinSession[]> {
  const db = supabaseServer();
  const { data } = await db
    .from("checkin_sessions")
    .select("*")
    .order("sort", { ascending: true })
    .order("starts_at", { ascending: true });
  return (data ?? []) as CheckinSession[];
}

/** Live counters for the active session, scoped to accepted teams. */
export async function getCheckinState(): Promise<CheckinState> {
  const db = supabaseServer();
  const session = await getActiveSession(db);

  const { data: acceptedTeams } = await db
    .from("teams")
    .select("id")
    .eq("status", "accepted");
  const teamIds = (acceptedTeams ?? []).map((t) => t.id as string);

  const empty: CheckinState["counts"] = {
    participantsChecked: 0,
    participantsTotal: 0,
    teamsComplete: 0,
    teamsTotal: teamIds.length,
  };
  if (teamIds.length === 0 || !session)
    return { session, counts: empty };

  const { data: parts } = await db
    .from("participants")
    .select("id")
    .in("team_id", teamIds);
  const acceptedParticipantIds = new Set((parts ?? []).map((p) => p.id as string));

  const { data: checks } = await db
    .from("check_ins")
    .select("participant_id")
    .eq("session_id", session.id);
  const checked = (checks ?? []).filter((c) =>
    acceptedParticipantIds.has(c.participant_id as string),
  ).length;

  const { count: teamsComplete } = await db
    .from("team_checkins")
    .select("team_id", { count: "exact", head: true })
    .eq("session_id", session.id)
    .in("team_id", teamIds);

  return {
    session,
    counts: {
      participantsChecked: checked,
      participantsTotal: acceptedParticipantIds.size,
      teamsComplete: teamsComplete ?? 0,
      teamsTotal: teamIds.length,
    },
  };
}

/** Insert a check-in for a participant and compute the team's new progress. */
export async function performCheckin(
  db: DB,
  adminId: string,
  participantId: string,
  sessionId: string,
): Promise<ScanResult> {
  const { data: participant } = await db
    .from("participants")
    .select("id, full_name, team_id")
    .eq("id", participantId)
    .maybeSingle();
  if (!participant) return { ok: false, error: "not_found" };

  // Only members of an ACCEPTED team may check in. Pending/rejected/waitlisted
  // members and undrafted solos (team_id null) are rejected here — otherwise a
  // valid-but-unaccepted QR would record a check-in that the accepted-scoped
  // counters never reflect (a silent desync). Fetch the team once and reuse it
  // below for the progress computation.
  type TeamRow = { name: string; team_code: string; status: string };
  const teamId = participant.team_id as string | null;
  let team: TeamRow | null = null;
  if (teamId) {
    const { data } = await db
      .from("teams")
      .select("name, team_code, status")
      .eq("id", teamId)
      .maybeSingle();
    team = (data as TeamRow | null) ?? null;
  }
  if (!team || team.status !== "accepted") {
    return { ok: false, error: "not_accepted" };
  }

  const insert = await db
    .from("check_ins")
    .insert({
      session_id: sessionId,
      participant_id: participantId,
      checked_in_by: adminId,
    });
  let already = false;
  if (insert.error) {
    if (insert.error.code === "23505") already = true; // unique: already checked in
    else return { ok: false, error: "failed" };
  }

  let progress: { checked: number; total: number } | null = null;
  let teamComplete = false;

  // teamId/team are guaranteed non-null here (accepted-team gate above).
  const teamName = team.name;
  const teamCode = team.team_code;
  {
    const { count: total } = await db
      .from("participants")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId);

    const { data: members } = await db
      .from("participants")
      .select("id")
      .eq("team_id", teamId);
    const memberIds = (members ?? []).map((m) => m.id as string);
    const { data: teamChecks } = await db
      .from("check_ins")
      .select("participant_id")
      .eq("session_id", sessionId)
      .in("participant_id", memberIds.length ? memberIds : ["00000000-0000-0000-0000-000000000000"]);
    const checked = (teamChecks ?? []).length;
    progress = { checked, total: total ?? memberIds.length };
    teamComplete = (total ?? 0) > 0 && checked >= (total ?? 0);
  }

  return {
    ok: true,
    member: { name: participant.full_name as string, teamName, teamCode },
    progress,
    teamComplete,
    already,
  };
}

export async function findParticipantByToken(
  db: DB,
  token: string,
): Promise<{ id: string; revoked: boolean } | null> {
  const { data } = await db
    .from("participants")
    .select("id, qr_revoked_at")
    .eq("qr_token", token)
    .maybeSingle();
  if (!data) return null;
  return { id: data.id as string, revoked: Boolean(data.qr_revoked_at) };
}

export async function searchRoster(query: string): Promise<RosterSearchTeam[]> {
  const db = supabaseServer();
  const q = query.trim();
  if (!q) return [];
  const session = await getActiveSession(db);

  const pattern = `%${q.replace(/[%_]/g, "")}%`;
  const { data: teams } = await db
    .from("teams")
    .select("id, team_code, name, status, members:participants(id, full_name, role)")
    .or(`team_code.ilike.${pattern},name.ilike.${pattern}`)
    .limit(12);

  const checkedSet = new Set<string>();
  if (session) {
    const { data: checks } = await db
      .from("check_ins")
      .select("participant_id")
      .eq("session_id", session.id);
    for (const c of checks ?? []) checkedSet.add(c.participant_id as string);
  }

  return (teams ?? []).map((t) => {
    const team = t as {
      team_code: string;
      name: string;
      status: string;
      members: { id: string; full_name: string; role: string }[];
    };
    return {
      code: team.team_code,
      name: team.name,
      status: team.status,
      members: (team.members ?? []).map((m) => ({
        id: m.id,
        name: m.full_name,
        role: m.role,
        checked: checkedSet.has(m.id),
      })),
    };
  });
}
