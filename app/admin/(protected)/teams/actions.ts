"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertRole, ForbiddenError } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { logAudit } from "@/lib/admin/audit";
import { DECISIONS, type Decision } from "@/lib/admin/types";
import { isOfficialTeamName } from "@/lib/team-names";
import { memberEditSchema, type MemberEditFields } from "@/lib/admin/member-edit";

export type ActionResult = { ok: true } | { ok: false; error: string };

const FORBIDDEN = "You don't have permission to do that.";
const GENERIC = "Something went wrong. Try again.";

const code = z.string().trim().toUpperCase().regex(/^ET4-[A-Z0-9]{5}$/);
const decision = z.enum(DECISIONS as [Decision, ...Decision[]]);
const note = z.string().trim().max(600).optional();

const ACTION_BY_DECISION: Record<Decision, string> = {
  accepted: "team.accept",
  waitlisted: "team.waitlist",
  rejected: "team.reject",
};

function revalidateTeam(teamCode?: string) {
  revalidatePath("/admin/teams");
  if (teamCode) revalidatePath(`/admin/teams/${teamCode}`);
}

/** Accept / waitlist / reject one team. Idempotent: a no-op status isn't logged. */
export async function decideTeam(
  codeRaw: string,
  decisionRaw: string,
  noteRaw?: string,
): Promise<ActionResult> {
  let admin;
  try {
    admin = await assertRole("manager");
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: FORBIDDEN };
    throw e;
  }

  const parsed = z
    .object({ code, decision, note })
    .safeParse({ code: codeRaw, decision: decisionRaw, note: noteRaw });
  if (!parsed.success) return { ok: false, error: GENERIC };

  const db = supabaseServer();
  const { data: current, error: readErr } = await db
    .from("teams")
    .select("status")
    .eq("team_code", parsed.data.code)
    .maybeSingle();
  if (readErr || !current) return { ok: false, error: GENERIC };

  const from = current.status as string;
  const noteVal = parsed.data.note?.length ? parsed.data.note : null;

  const { error } = await db
    .from("teams")
    .update({
      status: parsed.data.decision,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
      decision_note: noteVal,
    })
    .eq("team_code", parsed.data.code);
  if (error) return { ok: false, error: GENERIC };

  if (from !== parsed.data.decision) {
    await logAudit(admin.id, ACTION_BY_DECISION[parsed.data.decision], parsed.data.code, {
      from,
      to: parsed.data.decision,
    });
  }
  revalidateTeam(parsed.data.code);
  return { ok: true };
}

/** Bulk accept / waitlist / reject. One summary audit row. */
export async function bulkDecide(
  codesRaw: string[],
  decisionRaw: string,
): Promise<ActionResult> {
  let admin;
  try {
    admin = await assertRole("manager");
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: FORBIDDEN };
    throw e;
  }

  const parsed = z
    .object({ codes: z.array(code).min(1).max(500), decision })
    .safeParse({ codes: codesRaw, decision: decisionRaw });
  if (!parsed.success) return { ok: false, error: GENERIC };

  const db = supabaseServer();
  const { error } = await db
    .from("teams")
    .update({
      status: parsed.data.decision,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
      // clear any stale per-team note from a prior decision so it can't ride
      // into the next acceptance/rejection email (single decideTeam clears it too)
      decision_note: null,
    })
    .in("team_code", parsed.data.codes)
    .neq("status", parsed.data.decision); // idempotent: skip already-there rows
  if (error) return { ok: false, error: GENERIC };

  await logAudit(admin.id, "team.bulk", null, {
    to: parsed.data.decision,
    codes: parsed.data.codes,
    count: parsed.data.codes.length,
  });
  revalidateTeam();
  return { ok: true };
}

/** Assign (or clear, with "") an official codename from the fixed pool. */
export async function assignTeamName(
  codeRaw: string,
  nameRaw: string,
): Promise<ActionResult> {
  let admin;
  try {
    admin = await assertRole("manager");
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: FORBIDDEN };
    throw e;
  }
  const parsed = code.safeParse(codeRaw);
  if (!parsed.success) return { ok: false, error: GENERIC };

  const name = (nameRaw ?? "").trim();
  if (name && !isOfficialTeamName(name)) {
    return { ok: false, error: "That name isn't in the official pool." };
  }

  const db = supabaseServer();
  const { error } = await db
    .from("teams")
    .update({ assigned_name: name || null })
    .eq("team_code", parsed.data);
  if (error) {
    if (error.code === "23505")
      return { ok: false, error: "That name is already taken by another team." };
    return { ok: false, error: GENERIC };
  }

  await logAudit(admin.id, name ? "team.name.assign" : "team.name.clear", parsed.data, {
    name: name || null,
  });
  revalidateTeam(parsed.data);
  return { ok: true };
}

export async function toggleFlag(
  codeRaw: string,
  flagged: boolean,
): Promise<ActionResult> {
  let admin;
  try {
    admin = await assertRole("manager");
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: FORBIDDEN };
    throw e;
  }
  const parsed = code.safeParse(codeRaw);
  if (!parsed.success) return { ok: false, error: GENERIC };

  const db = supabaseServer();
  const { error } = await db
    .from("teams")
    .update({ flagged })
    .eq("team_code", parsed.data);
  if (error) return { ok: false, error: GENERIC };

  await logAudit(admin.id, flagged ? "team.flag" : "team.unflag", parsed.data);
  revalidateTeam(parsed.data);
  return { ok: true };
}

export async function saveInternalNote(
  codeRaw: string,
  noteRaw: string,
): Promise<ActionResult> {
  let admin;
  try {
    admin = await assertRole("manager");
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: FORBIDDEN };
    throw e;
  }
  const parsed = z
    .object({ code, note: z.string().trim().max(2000) })
    .safeParse({ code: codeRaw, note: noteRaw });
  if (!parsed.success) return { ok: false, error: GENERIC };

  const db = supabaseServer();
  const { error } = await db
    .from("teams")
    .update({ internal_note: parsed.data.note || null })
    .eq("team_code", parsed.data.code);
  if (error) return { ok: false, error: GENERIC };

  await logAudit(admin.id, "team.note", parsed.data.code);
  revalidateTeam(parsed.data.code);
  return { ok: true };
}

/**
 * Edit one participant's profile in place (super-admin only) — for when a
 * registered participant is replaced by another. Name + email are required;
 * the rest is optional. Role and team membership are not editable here.
 */
export async function updateMember(
  participantIdRaw: string,
  fieldsRaw: MemberEditFields,
): Promise<ActionResult> {
  let admin;
  try {
    admin = await assertRole("super_admin");
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: FORBIDDEN };
    throw e;
  }

  const id = z.string().uuid().safeParse(participantIdRaw);
  const fields = memberEditSchema.safeParse(fieldsRaw);
  if (!id.success || !fields.success) {
    return { ok: false, error: fields.success ? GENERIC : fields.error.issues[0].message };
  }

  const db = supabaseServer();
  // Resolve the owning team so we revalidate/audit against its code.
  const { data: current, error: readErr } = await db
    .from("participants")
    .select("id, team:teams(team_code)")
    .eq("id", id.data)
    .maybeSingle();
  if (readErr || !current) return { ok: false, error: GENERIC };
  // PostgREST types a to-one embed as an array; normalize either shape.
  const teamRel = current.team as
    | { team_code: string }
    | { team_code: string }[]
    | null;
  const teamCode = Array.isArray(teamRel) ? teamRel[0]?.team_code : teamRel?.team_code;

  const { error } = await db
    .from("participants")
    .update(fields.data)
    .eq("id", id.data);
  if (error) {
    if (error.code === "23505")
      return { ok: false, error: "That email is already used by another participant." };
    return { ok: false, error: GENERIC };
  }

  await logAudit(admin.id, "member.edit", teamCode ?? null, {
    participant_id: id.data,
    full_name: fields.data.full_name,
    email: fields.data.email,
  });
  revalidateTeam(teamCode);
  return { ok: true };
}
