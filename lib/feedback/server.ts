import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import type { Answers, Audience, ContributorRole } from "./questions";

// Token resolution + anonymous submission. Public callers reach this only via
// the service-role client (RLS denies the anon key), exactly like getTeamStatus.

export type TokenLookup =
  | {
      found: true;
      audience: Audience;
      role: ContributorRole | null;
      name: string;
      submitted: boolean;
      eligible: boolean; // participants: team accepted; contributors: always
    }
  | { found: false };

export async function lookupToken(tokenRaw: string): Promise<TokenLookup> {
  const token = tokenRaw.trim();
  if (!/^[a-f0-9]{18}$/.test(token)) return { found: false };

  let db;
  try {
    db = supabaseServer();
  } catch {
    return { found: false };
  }

  // participant?
  const { data: p } = await db
    .from("participants")
    .select("id, full_name, feedback_submitted_at, team:teams(status)")
    .eq("feedback_token", token)
    .maybeSingle();
  if (p) {
    const team = Array.isArray(p.team) ? p.team[0] : p.team;
    return {
      found: true,
      audience: "participant",
      role: null,
      name: p.full_name as string,
      submitted: !!p.feedback_submitted_at,
      eligible: (team?.status as string | undefined) === "accepted",
    };
  }

  // contributor?
  const { data: c } = await db
    .from("contributors")
    .select("id, full_name, role, feedback_submitted_at")
    .eq("feedback_token", token)
    .maybeSingle();
  if (c) {
    return {
      found: true,
      audience: "contributor",
      role: c.role as ContributorRole,
      name: c.full_name as string,
      submitted: !!c.feedback_submitted_at,
      eligible: true,
    };
  }

  return { found: false };
}

export type RecordResult =
  | { ok: true }
  | { ok: false; reason: "already" | "error" };

/**
 * Atomically claim the token (conditional update is the anti-double-submit lock)
 * then insert the ANONYMOUS response. The response row is never linked to the
 * person; only their own row gets a `feedback_submitted_at` stamp.
 */
export async function recordSubmission(
  token: string,
  audience: Audience,
  role: ContributorRole | null,
  answers: Answers,
): Promise<RecordResult> {
  let db;
  try {
    db = supabaseServer();
  } catch {
    return { ok: false, reason: "error" };
  }

  const table = audience === "participant" ? "participants" : "contributors";
  const { data: claimed, error: claimErr } = await db
    .from(table)
    .update({ feedback_submitted_at: new Date().toISOString() })
    .eq("feedback_token", token)
    .is("feedback_submitted_at", null)
    .select("id")
    .maybeSingle();

  if (claimErr) return { ok: false, reason: "error" };
  if (!claimed) return { ok: false, reason: "already" };

  const { error: insErr } = await db
    .from("feedback_responses")
    .insert({ audience, role, answers });

  if (insErr) {
    // best-effort rollback of the claim so the user can retry
    await db
      .from(table)
      .update({ feedback_submitted_at: null })
      .eq("id", claimed.id as string);
    return { ok: false, reason: "error" };
  }

  return { ok: true };
}
