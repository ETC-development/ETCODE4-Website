"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertRole, ForbiddenError } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { sendMail, isEmailConfigured } from "@/lib/email";
import { renderFeedbackEmail } from "@/lib/emails/feedback";
import { logAudit } from "@/lib/admin/audit";
import { EVENT } from "@/lib/content";

const FORBIDDEN = "You don't have permission to send feedback emails.";
const GENERIC = "Something went wrong. Try again.";
const NOT_CONFIGURED = "Email isn't configured yet (set the EMAIL_* env vars).";

async function guardSuper() {
  return assertRole("super_admin");
}

export type SendResult =
  | { ok: true; status: "sent" | "skipped" }
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Shared send: render the invite, log to `emails`, mark feedback_sent_at.
// `who` describes either a participant or a contributor recipient.
// ---------------------------------------------------------------------------
async function doSendFeedback(
  adminId: string,
  who: {
    table: "participants" | "contributors";
    id: string;
    name: string;
    email: string;
    token: string;
    sentAt: string | null;
    audienceLabel: "participant" | "organizer" | "mentor";
    template: "feedback_participant" | "feedback_contributor";
    teamId?: string | null;
    contributorId?: string | null;
  },
  force: boolean,
): Promise<SendResult> {
  if (!isEmailConfigured()) return { ok: false, error: NOT_CONFIGURED };
  if (!who.email) return { ok: false, error: "No email on file." };
  if (!who.token) return { ok: false, error: "No feedback token." };
  if (!force && who.sentAt) return { ok: true, status: "skipped" };

  const { subject, html } = await renderFeedbackEmail({
    audienceLabel: who.audienceLabel,
    recipientName: who.name,
    token: who.token,
  });

  const db = supabaseServer();
  const { data: row } = await db
    .from("emails")
    .insert({
      team_id: who.teamId ?? null,
      contributor_id: who.contributorId ?? null,
      to_email: who.email,
      template: who.template,
      status: "queued",
      sent_by: adminId,
    })
    .select("id")
    .single();
  const rowId = row?.id as string | undefined;

  try {
    const messageId = await sendMail({
      to: who.email,
      subject,
      html,
      replyTo: EVENT.contactEmail,
    });
    if (rowId)
      await db
        .from("emails")
        .update({ status: "sent", provider_id: messageId, error: null })
        .eq("id", rowId);
    await db
      .from(who.table)
      .update({ feedback_sent_at: new Date().toISOString() })
      .eq("id", who.id);
    await logAudit(adminId, `feedback.${who.template}`, who.email);
    return { ok: true, status: "sent" };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (rowId)
      await db.from("emails").update({ status: "failed", error: message }).eq("id", rowId);
    return { ok: false, error: "Send failed. See the email log." };
  }
}

// ---------------------------------------------------------------------------
// Participant invite (members of accepted teams).
// ---------------------------------------------------------------------------
export async function sendParticipantFeedback(
  participantId: string,
  force = false,
): Promise<SendResult> {
  let admin;
  try {
    admin = await guardSuper();
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: FORBIDDEN };
    throw e;
  }
  if (!z.string().uuid().safeParse(participantId).success)
    return { ok: false, error: GENERIC };

  const db = supabaseServer();
  const { data: p } = await db
    .from("participants")
    .select(
      "id, full_name, email, team_id, feedback_token, feedback_sent_at, team:teams(status)",
    )
    .eq("id", participantId)
    .maybeSingle();
  if (!p) return { ok: false, error: "Participant not found." };
  const team = Array.isArray(p.team) ? p.team[0] : p.team;
  if ((team?.status as string | undefined) !== "accepted")
    return { ok: false, error: "Only accepted participants can be emailed." };

  const res = await doSendFeedback(
    admin.id,
    {
      table: "participants",
      id: p.id as string,
      name: p.full_name as string,
      email: p.email as string,
      token: p.feedback_token as string,
      sentAt: (p.feedback_sent_at as string) ?? null,
      audienceLabel: "participant",
      template: "feedback_participant",
      teamId: (p.team_id as string) ?? null,
    },
    force,
  );
  revalidatePath("/admin/feedback");
  return res;
}

// ---------------------------------------------------------------------------
// Contributor invite (organizer / mentor).
// ---------------------------------------------------------------------------
export async function sendContributorFeedback(
  contributorId: string,
  force = false,
): Promise<SendResult> {
  let admin;
  try {
    admin = await guardSuper();
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: FORBIDDEN };
    throw e;
  }
  if (!z.string().uuid().safeParse(contributorId).success)
    return { ok: false, error: GENERIC };

  const db = supabaseServer();
  const { data: c } = await db
    .from("contributors")
    .select("id, full_name, email, role, feedback_token, feedback_sent_at")
    .eq("id", contributorId)
    .maybeSingle();
  if (!c) return { ok: false, error: "Contributor not found." };

  const res = await doSendFeedback(
    admin.id,
    {
      table: "contributors",
      id: c.id as string,
      name: c.full_name as string,
      email: c.email as string,
      token: c.feedback_token as string,
      sentAt: (c.feedback_sent_at as string) ?? null,
      audienceLabel: c.role as "organizer" | "mentor",
      template: "feedback_contributor",
      contributorId: c.id as string,
    },
    force,
  );
  revalidatePath("/admin/feedback");
  return res;
}

// ---------------------------------------------------------------------------
// Import contributors from pasted "Name, email, role" lines. Dedupe by email.
// ---------------------------------------------------------------------------
export type ImportResult =
  | { ok: true; added: number; skipped: number; errors: string[] }
  | { ok: false; error: string };

const ROLE_ALIASES: Record<string, "organizer" | "mentor"> = {
  organizer: "organizer",
  organiser: "organizer",
  org: "organizer",
  mentor: "mentor",
  judge: "mentor",
  "problem setter": "mentor",
};

export async function importContributors(text: string): Promise<ImportResult> {
  let admin;
  try {
    admin = await guardSuper();
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: FORBIDDEN };
    throw e;
  }
  if (typeof text !== "string" || text.trim().length === 0)
    return { ok: false, error: "Paste at least one contributor." };

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const rows: { full_name: string; email: string; role: "organizer" | "mentor" }[] = [];
  const errors: string[] = [];

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    // accept comma, tab, or semicolon separators
    const parts = line.split(/[,\t;]/).map((s) => s.trim());
    if (parts.length < 3) {
      errors.push(`Skipped (need Name, email, role): "${line}"`);
      continue;
    }
    const [name, email, roleRaw] = parts;
    const role = ROLE_ALIASES[roleRaw.toLowerCase()];
    if (!name || !emailRe.test(email) || !role) {
      errors.push(`Skipped (bad row): "${line}"`);
      continue;
    }
    rows.push({ full_name: name, email: email.toLowerCase(), role });
  }

  if (rows.length === 0)
    return { ok: true, added: 0, skipped: 0, errors: errors.length ? errors : ["Nothing to import."] };

  const db = supabaseServer();
  // existing emails (skip dupes; insert with id select to count adds)
  const { data: existing } = await db
    .from("contributors")
    .select("email")
    .in("email", rows.map((r) => r.email));
  const have = new Set((existing ?? []).map((e) => (e.email as string).toLowerCase()));

  // de-dupe within the paste too
  const seen = new Set<string>();
  const toInsert = rows.filter((r) => {
    if (have.has(r.email) || seen.has(r.email)) return false;
    seen.add(r.email);
    return true;
  });
  const skipped = rows.length - toInsert.length;

  if (toInsert.length === 0)
    return { ok: true, added: 0, skipped, errors };

  const { error } = await db
    .from("contributors")
    .insert(toInsert.map((r) => ({ ...r, created_by: admin.id })));
  if (error) return { ok: false, error: GENERIC };

  await logAudit(admin.id, "feedback.contributors_import", null, {
    added: toInsert.length,
    skipped,
  });
  revalidatePath("/admin/feedback");
  return { ok: true, added: toInsert.length, skipped, errors };
}
