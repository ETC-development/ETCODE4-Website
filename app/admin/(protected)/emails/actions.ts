"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertRole, ForbiddenError } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { sendMail, isEmailConfigured } from "@/lib/email";
import {
  renderEmail,
  defaultNote,
  defaultSubject,
  type EmailTemplate,
} from "@/lib/emails/render";
import { logAudit } from "@/lib/admin/audit";
import { EVENT } from "@/lib/content";

// Overrides the sender can set in the preview before sending. Both optional;
// blank/undefined fall back to the template defaults.
const overridesSchema = z
  .object({
    subject: z.string().trim().max(150).optional(),
    note: z.string().max(1000).optional(),
  })
  .optional();
export type EmailOverrides = z.infer<typeof overridesSchema>;

// NB: the Node.js runtime (for Nodemailer) is pinned on the invoking routes
// (emails/page.tsx, teams/[code]/page.tsx) — a "use server" file can't export
// route-segment config itself.

const codeSchema = z.string().trim().toUpperCase().regex(/^ET4-[A-Z0-9]{5}$/);
const templateSchema = z.enum([
  "acceptance",
  "rejection",
  "reminder",
  "checkin_qr",
]);

const FORBIDDEN = "You don't have permission to send emails.";
const GENERIC = "Something went wrong. Try again.";
const NOT_CONFIGURED =
  "Email isn't configured yet (set the EMAIL_* env vars).";

type TeamForEmail = {
  id: string;
  team_code: string;
  name: string;
  assigned_name: string | null;
  status: string;
  decision_note: string | null;
  members: {
    role: string;
    full_name: string;
    email: string;
    qr_token: string | null;
  }[];
};

function emailData(team: TeamForEmail) {
  return {
    // official codename when assigned, else the leader's registration name
    teamName: team.assigned_name || team.name,
    registeredName: team.name, // self-chosen registration name
    assignedName: team.assigned_name, // official codename (null until assigned)
    code: team.team_code,
    leaderName:
      team.members.find((m) => m.role === "leader")?.full_name ??
      team.members[0]?.full_name ??
      "there",
    note: team.decision_note,
    members: team.members.map((m) => ({
      name: m.full_name,
      qrToken: m.qr_token,
    })),
  };
}

async function guardSuper() {
  return assertRole("super_admin"); // throws ForbiddenError otherwise
}

async function loadTeam(code: string): Promise<TeamForEmail | null> {
  const db = supabaseServer();
  const { data } = await db
    .from("teams")
    .select(
      "id, team_code, name, assigned_name, status, decision_note, members:participants(role, full_name, email, qr_token)",
    )
    .eq("team_code", code)
    .maybeSingle();
  return (data as TeamForEmail | null) ?? null;
}

function recipients(team: TeamForEmail): { to: string; cc: string[] } {
  const leader =
    team.members.find((m) => m.role === "leader") ?? team.members[0];
  const to = leader?.email ?? "";
  const cc = team.members.filter((m) => m.email !== to).map((m) => m.email);
  return { to, cc };
}

async function lastSentAt(
  teamId: string,
  template: EmailTemplate,
): Promise<string | null> {
  const db = supabaseServer();
  const { data } = await db
    .from("emails")
    .select("created_at")
    .eq("team_id", teamId)
    .eq("template", template)
    .eq("status", "sent")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.created_at as string) ?? null;
}

export type PreviewResult =
  | {
      ok: true;
      subject: string; // rendered subject (after overrides)
      html: string;
      to: string;
      cc: string[];
      status: string;
      alreadySentAt: string | null;
      defaultSubject: string; // seed for the editable subject field
      defaultNote: string; // seed for the editable message field
    }
  | { ok: false; error: string };

export async function previewEmail(
  codeRaw: string,
  templateRaw: string,
  overridesRaw?: EmailOverrides,
): Promise<PreviewResult> {
  try {
    await guardSuper();
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: FORBIDDEN };
    throw e;
  }
  const parsed = z
    .object({
      code: codeSchema,
      template: templateSchema,
      overrides: overridesSchema,
    })
    .safeParse({ code: codeRaw, template: templateRaw, overrides: overridesRaw });
  if (!parsed.success) return { ok: false, error: GENERIC };

  const team = await loadTeam(parsed.data.code);
  if (!team) return { ok: false, error: "Team not found." };

  const { to, cc } = recipients(team);
  if (!to) return { ok: false, error: "This team has no leader email." };

  const { subject, html } = await renderEmail(parsed.data.template, emailData(team), {
    mode: "preview",
    subject: parsed.data.overrides?.subject,
    note: parsed.data.overrides?.note,
  });

  return {
    ok: true,
    subject,
    html,
    to,
    cc,
    status: team.status,
    alreadySentAt: await lastSentAt(team.id, parsed.data.template),
    defaultSubject: defaultSubject(parsed.data.template),
    defaultNote: defaultNote(parsed.data.template, team.decision_note),
  };
}

export type SendResult =
  | { ok: true; status: "sent" | "skipped" }
  | { ok: false; error: string };

async function doSend(
  adminId: string,
  team: TeamForEmail,
  template: EmailTemplate,
  force: boolean,
  overrides?: EmailOverrides,
): Promise<SendResult> {
  if (!isEmailConfigured()) return { ok: false, error: NOT_CONFIGURED };

  const { to, cc } = recipients(team);
  if (!to) return { ok: false, error: "This team has no leader email." };

  if (!force && (await lastSentAt(team.id, template))) {
    return { ok: true, status: "skipped" }; // idempotent: already sent
  }

  const { subject, html, attachments } = await renderEmail(
    template,
    emailData(team),
    { mode: "send", subject: overrides?.subject, note: overrides?.note },
  );

  const db = supabaseServer();
  const { data: row } = await db
    .from("emails")
    .insert({
      team_id: team.id,
      to_email: to,
      template,
      status: "queued",
      sent_by: adminId,
    })
    .select("id")
    .single();
  const rowId = row?.id as string | undefined;

  try {
    const messageId = await sendMail({
      to,
      cc,
      subject,
      html,
      attachments,
      replyTo: EVENT.contactEmail,
    });
    if (rowId)
      await db
        .from("emails")
        .update({ status: "sent", provider_id: messageId, error: null })
        .eq("id", rowId);
    await logAudit(adminId, `email.${template}`, team.team_code, {
      to,
      cc_count: cc.length,
    });
    return { ok: true, status: "sent" };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (rowId)
      await db
        .from("emails")
        .update({ status: "failed", error: message })
        .eq("id", rowId);
    return { ok: false, error: "Send failed. See the email log." };
  }
}

export async function sendTeamEmail(
  codeRaw: string,
  templateRaw: string,
  force = false,
  overridesRaw?: EmailOverrides,
): Promise<SendResult> {
  let admin;
  try {
    admin = await guardSuper();
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: FORBIDDEN };
    throw e;
  }
  const parsed = z
    .object({
      code: codeSchema,
      template: templateSchema,
      overrides: overridesSchema,
    })
    .safeParse({ code: codeRaw, template: templateRaw, overrides: overridesRaw });
  if (!parsed.success) return { ok: false, error: GENERIC };

  const team = await loadTeam(parsed.data.code);
  if (!team) return { ok: false, error: "Team not found." };

  const res = await doSend(
    admin.id,
    team,
    parsed.data.template,
    force,
    parsed.data.overrides,
  );
  revalidatePath("/admin/emails");
  revalidatePath(`/admin/teams/${parsed.data.code}`);
  return res;
}

export async function retryEmail(emailId: string): Promise<SendResult> {
  let admin;
  try {
    admin = await guardSuper();
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: FORBIDDEN };
    throw e;
  }
  const parsed = z.string().uuid().safeParse(emailId);
  if (!parsed.success) return { ok: false, error: GENERIC };

  const db = supabaseServer();
  const { data: row } = await db
    .from("emails")
    .select("template, team:teams(team_code)")
    .eq("id", parsed.data)
    .maybeSingle();
  const template = row?.template as EmailTemplate | undefined;
  // PostgREST types the embed as an array; normalize to the single related row.
  const rel = row?.team as unknown;
  const code = (
    Array.isArray(rel) ? rel[0] : (rel as { team_code?: string } | null)
  )?.team_code;
  if (!template || !code) return { ok: false, error: "Email record not found." };

  const team = await loadTeam(code);
  if (!team) return { ok: false, error: "Team not found." };

  const res = await doSend(admin.id, team, template, true); // force resend
  revalidatePath("/admin/emails");
  return res;
}
