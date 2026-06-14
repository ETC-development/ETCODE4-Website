"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import {
  createTeamSchema,
  joinTeamSchema,
  soloSchema,
  TEAM_CODE_RE,
  type Participant,
} from "@/lib/schema";
import { genTeamCode, normalizeTeamCode } from "@/lib/utils";
import { hit, clientKey } from "@/lib/rate-limit";
import { EVENT } from "@/lib/content";
import { getRegistrationStatus } from "@/lib/registration";

export type ActionResult = { ok: true } | { ok: false; error: string };

const GENERIC = "Something went wrong on our end. Try again in a moment.";
const NOT_CONFIGURED =
  "Registration isn't live yet, the organizers are setting up the roster. Check back soon.";
const DUP_EMAIL = "That email is already on the roster. Each player registers once.";
const TOO_MANY = "Too many attempts. Technical Time-Out: Take a breather and try again in a minute.";
const CLOSED =
  "Registration is closed for now. Watch ETC's socials for the next tip-off.";

function isBot(values: unknown): boolean {
  const v = (values ?? {}) as Record<string, unknown>;
  return typeof v.website === "string" && v.website.trim().length > 0;
}

function participantRow(p: Participant) {
  const institution =
    p.institution === "Other" ? (p.institution_other || "").trim() : p.institution;
  return {
    full_name: p.full_name,
    email: p.email.toLowerCase(),
    phone: p.phone,
    institution,
    study_year: p.study_year,
    leetcode: p.leetcode || null,
    hackerrank: p.hackerrank || null,
    github: p.github || null,
    tshirt_size: p.tshirt_size || null,
  };
}

export async function createTeam(values: unknown): Promise<ActionResult> {
  if (isBot(values)) return { ok: true };
  if (!hit(await clientKey("create"), 5, 60_000)) return { ok: false, error: TOO_MANY };

  const parsed = createTeamSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "Check your details and try again." };
  const { team_name, motivation, ...participant } = parsed.data;

  let db;
  try {
    db = supabaseServer();
  } catch {
    return { ok: false, error: NOT_CONFIGURED };
  }

  if (!(await getRegistrationStatus()).open) return { ok: false, error: CLOSED };

  let code = "";
  let teamId = "";
  for (let attempt = 0; attempt < 6; attempt++) {
    code = genTeamCode();
    const { data, error } = await db
      .from("teams")
      .insert({ team_code: code, name: team_name })
      .select("id")
      .single();
    if (!error && data) {
      teamId = data.id;
      break;
    }
    if (error?.code === "23505") continue;
    return { ok: false, error: GENERIC };
  }
  if (!teamId) return { ok: false, error: GENERIC };

  const { error: pErr } = await db
    .from("participants")
    .insert({ team_id: teamId, role: "leader", motivation, ...participantRow(participant) });

  if (pErr) {
    await db.from("teams").delete().eq("id", teamId);
    if (pErr.code === "23505") return { ok: false, error: DUP_EMAIL };
    return { ok: false, error: GENERIC };
  }

  redirect(`/register/success?role=leader&code=${code}&team=${encodeURIComponent(team_name)}`);
}

export async function verifyTeamCode(codeRaw: string): Promise<{
  ok: boolean;
  team?: string;
  remaining?: number;
  error?: string;
}> {
  if (!hit(await clientKey("verify"), 20, 60_000))
    return { ok: false, error: TOO_MANY };

  const code = normalizeTeamCode(codeRaw);
  if (!TEAM_CODE_RE.test(code))
    return { ok: false, error: "Team codes look like ET4-7KQ2X." };

  let db;
  try {
    db = supabaseServer();
  } catch {
    return { ok: false, error: NOT_CONFIGURED };
  }

  const { data: team } = await db
    .from("teams")
    .select("id,name")
    .eq("team_code", code)
    .maybeSingle();
  if (!team)
    return { ok: false, error: "That team code isn't on the roster. Check it with your leader." };

  const { count } = await db
    .from("participants")
    .select("id", { count: "exact", head: true })
    .eq("team_id", team.id);
  const n = count ?? 0;
  if (n >= 3)
    return { ok: false, error: "This team already has 3 players. Try another, or register solo." };

  return { ok: true, team: team.name, remaining: 3 - n };
}

export async function joinTeam(values: unknown): Promise<ActionResult> {
  if (isBot(values)) return { ok: true };
  if (!hit(await clientKey("join"), 8, 60_000)) return { ok: false, error: TOO_MANY };

  const parsed = joinTeamSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "Check your details and try again." };
  const { team_code, ...participant } = parsed.data;

  let db;
  try {
    db = supabaseServer();
  } catch {
    return { ok: false, error: NOT_CONFIGURED };
  }

  if (!(await getRegistrationStatus()).open) return { ok: false, error: CLOSED };

  const { data, error } = await db.rpc("join_team", {
    p_code: normalizeTeamCode(team_code),
    p: participantRow(participant),
  });

  if (error) return { ok: false, error: GENERIC };

  const res = data as { ok: boolean; error?: string; team?: string; count?: number };
  if (!res?.ok) {
    switch (res?.error) {
      case "code_not_found":
        return { ok: false, error: "That team code isn't on the roster. Check it with your leader." };
      case "team_full":
        return { ok: false, error: "This team already has 3 players. Try another, or register solo." };
      case "email_taken":
        return { ok: false, error: DUP_EMAIL };
      default:
        return { ok: false, error: GENERIC };
    }
  }

  redirect(
    `/register/success?role=member&team=${encodeURIComponent(res.team ?? "")}&count=${res.count ?? 3}`,
  );
}

export async function registerSolo(values: unknown): Promise<ActionResult> {
  if (isBot(values)) return { ok: true };
  if (!hit(await clientKey("solo"), 5, 60_000)) return { ok: false, error: TOO_MANY };

  const parsed = soloSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "Check your details and try again." };

  let db;
  try {
    db = supabaseServer();
  } catch {
    return { ok: false, error: NOT_CONFIGURED };
  }

  if (!(await getRegistrationStatus()).open) return { ok: false, error: CLOSED };

  const { error } = await db
    .from("participants")
    .insert({
      team_id: null,
      role: "solo",
      motivation: parsed.data.motivation,
      ...participantRow(parsed.data),
    });

  if (error) {
    if (error.code === "23505") return { ok: false, error: DUP_EMAIL };
    return { ok: false, error: GENERIC };
  }

  redirect("/register/success?role=solo");
}

// ---------------------------------------------------------------------------
// Public team-status lookup (§8). No auth. Rate-limited. Keyed by team_code,
// returns ONLY that team's own minimal payload — never an open table read.
// QR tokens are included only for accepted teams (and never revoked ones); no
// emails/phones/internal data are exposed.
// ---------------------------------------------------------------------------

export type StatusMember = {
  name: string;
  role: string;
  institution: string | null;
  qr_token: string | null; // present only when accepted
};

export type TeamStatusResult =
  | {
      ok: true;
      team: { code: string; name: string; status: string };
      members: StatusMember[];
      logistics: { dates: string; venue: string } | null;
    }
  | { ok: false; error: string };

function eventDateRange(): string {
  const tz = "Africa/Algiers";
  const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: tz }).format(new Date(iso));
  const a = fmt(EVENT.startISO, { day: "numeric" });
  const b = fmt(EVENT.endISO, { day: "numeric" });
  const my = fmt(EVENT.endISO, { month: "long", year: "numeric" });
  return a === b ? `${a} ${my}` : `${a}–${b} ${my}`;
}

const ROLE_RANK: Record<string, number> = { leader: 0, member: 1, solo: 2 };

export async function getTeamStatus(codeRaw: string): Promise<TeamStatusResult> {
  if (!hit(await clientKey("status"), 30, 60_000))
    return { ok: false, error: TOO_MANY };

  const code = normalizeTeamCode(codeRaw);
  if (!TEAM_CODE_RE.test(code))
    return { ok: false, error: "Team codes look like ET4-7KQ2X." };

  let db;
  try {
    db = supabaseServer();
  } catch {
    return { ok: false, error: NOT_CONFIGURED };
  }

  const { data: team } = await db
    .from("teams")
    .select("id, team_code, name, assigned_name, status")
    .eq("team_code", code)
    .maybeSingle();
  if (!team)
    return {
      ok: false,
      error: "That team code isn't on the roster. Check it with your leader.",
    };

  const accepted = team.status === "accepted";

  const { data: rows } = await db
    .from("participants")
    .select("full_name, role, institution, qr_token, qr_revoked_at")
    .eq("team_id", team.id);

  const members: StatusMember[] = (rows ?? [])
    .map((m) => ({
      name: m.full_name as string,
      role: m.role as string,
      institution: (m.institution as string) ?? null,
      qr_token:
        accepted && !m.qr_revoked_at ? (m.qr_token as string) : null,
    }))
    .sort((a, b) => (ROLE_RANK[a.role] ?? 9) - (ROLE_RANK[b.role] ?? 9));

  return {
    ok: true,
    team: {
      code: team.team_code,
      name: team.assigned_name || team.name,
      status: team.status,
    },
    members,
    logistics: accepted
      ? { dates: eventDateRange(), venue: EVENT.venue }
      : null,
  };
}
