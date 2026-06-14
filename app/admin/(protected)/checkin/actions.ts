"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertRole, ForbiddenError } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { logAudit } from "@/lib/admin/audit";
import {
  findParticipantByToken,
  getActiveSession,
  getCheckinState,
  performCheckin,
  searchRoster,
  type CheckinState,
  type RosterSearchTeam,
  type ScanResult,
} from "@/lib/admin/checkin";

export type ActionResult = { ok: true } | { ok: false; error: string };

const FORBIDDEN = "You don't have permission to do that.";
const GENERIC = "Something went wrong. Try again.";

async function guard(role: "hr_checkin" | "super_admin") {
  return assertRole(role);
}

// --- check-in (hr_checkin+) -------------------------------------------------

export async function checkInByToken(tokenRaw: string): Promise<ScanResult> {
  let admin;
  try {
    admin = await guard("hr_checkin");
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: "failed" };
    throw e;
  }
  const token = (tokenRaw ?? "").trim();
  if (!/^[a-f0-9]{18}$/i.test(token)) return { ok: false, error: "unknown_qr" };

  const db = supabaseServer();
  const session = await getActiveSession(db);
  if (!session) return { ok: false, error: "no_active_session" };

  const found = await findParticipantByToken(db, token);
  if (!found) return { ok: false, error: "unknown_qr" };
  if (found.revoked) return { ok: false, error: "revoked" };

  const res = await performCheckin(db, admin.id, found.id, session.id);
  revalidatePath("/admin/checkin");
  return res;
}

export async function checkInParticipant(
  participantIdRaw: string,
): Promise<ScanResult> {
  let admin;
  try {
    admin = await guard("hr_checkin");
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: "failed" };
    throw e;
  }
  const parsed = z.string().uuid().safeParse(participantIdRaw);
  if (!parsed.success) return { ok: false, error: "not_found" };

  const db = supabaseServer();
  const session = await getActiveSession(db);
  if (!session) return { ok: false, error: "no_active_session" };

  const res = await performCheckin(db, admin.id, parsed.data, session.id);
  revalidatePath("/admin/checkin");
  return res;
}

export async function searchRosterAction(
  query: string,
): Promise<RosterSearchTeam[]> {
  try {
    await guard("hr_checkin");
  } catch {
    return [];
  }
  return searchRoster(query);
}

export async function refreshState(): Promise<CheckinState | null> {
  try {
    await guard("hr_checkin");
  } catch {
    return null;
  }
  return getCheckinState();
}

// --- session management (super_admin) ---------------------------------------

const KINDS = ["general", "meal"] as const;

export async function createSession(
  label: string,
  kind: string,
  startsAt?: string,
): Promise<ActionResult> {
  let admin;
  try {
    admin = await guard("super_admin");
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: FORBIDDEN };
    throw e;
  }
  const parsed = z
    .object({
      label: z.string().trim().min(2).max(60),
      kind: z.enum(KINDS),
      startsAt: z.string().datetime().optional().or(z.literal("")),
    })
    .safeParse({ label, kind, startsAt: startsAt ?? "" });
  if (!parsed.success) return { ok: false, error: GENERIC };

  const db = supabaseServer();
  const { count } = await db
    .from("checkin_sessions")
    .select("id", { count: "exact", head: true });

  const { error } = await db.from("checkin_sessions").insert({
    label: parsed.data.label,
    kind: parsed.data.kind,
    starts_at: parsed.data.startsAt || null,
    sort: count ?? 0,
  });
  if (error) return { ok: false, error: GENERIC };

  await logAudit(admin.id, "session.create", parsed.data.label, {
    kind: parsed.data.kind,
  });
  revalidatePath("/admin/checkin");
  return { ok: true };
}

export async function setActiveSession(idRaw: string): Promise<ActionResult> {
  let admin;
  try {
    admin = await guard("super_admin");
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: FORBIDDEN };
    throw e;
  }
  const parsed = z.string().uuid().safeParse(idRaw);
  if (!parsed.success) return { ok: false, error: GENERIC };

  const db = supabaseServer();
  // exactly one active session
  await db.from("checkin_sessions").update({ is_active: false }).eq("is_active", true);
  const { error } = await db
    .from("checkin_sessions")
    .update({ is_active: true })
    .eq("id", parsed.data);
  if (error) return { ok: false, error: GENERIC };

  await logAudit(admin.id, "session.activate", parsed.data);
  revalidatePath("/admin/checkin");
  return { ok: true };
}

export async function deleteSession(idRaw: string): Promise<ActionResult> {
  let admin;
  try {
    admin = await guard("super_admin");
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: FORBIDDEN };
    throw e;
  }
  const parsed = z.string().uuid().safeParse(idRaw);
  if (!parsed.success) return { ok: false, error: GENERIC };

  const db = supabaseServer();
  const { error } = await db
    .from("checkin_sessions")
    .delete()
    .eq("id", parsed.data);
  if (error) return { ok: false, error: GENERIC };

  await logAudit(admin.id, "session.delete", parsed.data);
  revalidatePath("/admin/checkin");
  return { ok: true };
}
