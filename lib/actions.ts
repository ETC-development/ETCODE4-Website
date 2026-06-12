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

export type ActionResult = { ok: true } | { ok: false; error: string };

const GENERIC = "Something went wrong on our end. Try again in a moment.";
const NOT_CONFIGURED =
  "Registration isn't live yet, the organizers are setting up the roster. Check back soon.";
const DUP_EMAIL = "That email is already on the roster. Each player registers once.";
const TOO_MANY = "Too many attempts. Technical Time-Out: Take a breather and try again in a minute.";

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
