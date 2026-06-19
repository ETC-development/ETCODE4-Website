"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertRole, ForbiddenError } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { genTeamCode } from "@/lib/utils";
import { logAudit } from "@/lib/admin/audit";
import { sendMail, isEmailConfigured } from "@/lib/email";
import { renderEmail } from "@/lib/emails/render";
import { EVENT } from "@/lib/content";

export type DraftResult =
  | { ok: true; code: string }
  | { ok: false; error: string };

export type SoloResult = { ok: true } | { ok: false; error: string };

const GENERIC = "Something went wrong. Try again.";
const FORBIDDEN = "You don't have permission to do that.";
const NOT_CONFIGURED = "Email isn't configured yet (set the EMAIL_* env vars).";
const ALREADY =
  "One of those players was just drafted by someone else. Refresh and retry.";

export async function formTeamFromSolos(
  participantIds: string[],
  teamName: string,
): Promise<DraftResult> {
  let admin;
  try {
    admin = await assertRole("manager");
  } catch (e) {
    if (e instanceof ForbiddenError)
      return { ok: false, error: "You don't have permission to do that." };
    throw e;
  }

  const parsed = z
    .object({
      ids: z.array(z.string().uuid()).length(3),
      name: z.string().trim().min(2).max(60),
    })
    .safeParse({ ids: participantIds, name: teamName });
  if (!parsed.success) return { ok: false, error: GENERIC };

  const [leaderId, ...memberIds] = parsed.data.ids;
  const db = supabaseServer();

  // create the team
  let teamId = "";
  let code = "";
  for (let attempt = 0; attempt < 6; attempt++) {
    code = genTeamCode();
    const { data, error } = await db
      .from("teams")
      .insert({ team_code: code, name: parsed.data.name })
      .select("id")
      .single();
    if (!error && data) {
      teamId = data.id as string;
      break;
    }
    if (error?.code === "23505") continue; // code collision
    return { ok: false, error: GENERIC };
  }
  if (!teamId) return { ok: false, error: GENERIC };

  // assign leader (only if still a free agent)
  const { data: leaderUpd } = await db
    .from("participants")
    .update({ team_id: teamId, role: "leader" })
    .eq("id", leaderId)
    .is("team_id", null)
    .select("id");

  // assign members (only those still free)
  const { data: memberUpd } = await db
    .from("participants")
    .update({ team_id: teamId, role: "member" })
    .in("id", memberIds)
    .is("team_id", null)
    .select("id");

  if ((leaderUpd?.length ?? 0) !== 1 || (memberUpd?.length ?? 0) !== memberIds.length) {
    // someone got drafted concurrently — roll back cleanly
    await db
      .from("participants")
      .update({ team_id: null, role: "solo" })
      .eq("team_id", teamId);
    await db.from("teams").delete().eq("id", teamId);
    return { ok: false, error: ALREADY };
  }

  await logAudit(admin.id, "draft.form_team", code, { from_solos: parsed.data.ids });
  revalidatePath("/admin/draft");
  revalidatePath("/admin/teams");
  return { ok: true, code };
}

/**
 * Draft one solo free-agent into an existing team that still has an open slot.
 * Capacity is re-checked after the claim and rolled back if the team overfilled
 * under a concurrent draft.
 */
export async function addSoloToTeam(
  participantId: string,
  teamId: string,
): Promise<DraftResult> {
  let admin;
  try {
    admin = await assertRole("manager");
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: FORBIDDEN };
    throw e;
  }

  const parsed = z
    .object({ participantId: z.string().uuid(), teamId: z.string().uuid() })
    .safeParse({ participantId, teamId });
  if (!parsed.success) return { ok: false, error: GENERIC };

  const db = supabaseServer();

  // team must exist, not be rejected, and have an open slot
  const { data: team } = await db
    .from("teams")
    .select("team_code, status, members:participants(id)")
    .eq("id", parsed.data.teamId)
    .maybeSingle();
  if (!team) return { ok: false, error: "That team no longer exists." };
  if (team.status === "rejected")
    return { ok: false, error: "Can't add a player to a rejected team." };
  const count = ((team.members as { id: string }[] | null) ?? []).length;
  if (count >= 3) return { ok: false, error: "That team is already full." };

  // claim the solo only if still a free agent and not rejected
  const { data: claimed } = await db
    .from("participants")
    .update({ team_id: parsed.data.teamId, role: "member" })
    .eq("id", parsed.data.participantId)
    .is("team_id", null)
    .is("rejected_at", null)
    .select("id");
  if ((claimed?.length ?? 0) !== 1)
    return {
      ok: false,
      error: "That applicant was just drafted or rejected. Refresh and retry.",
    };

  // re-check capacity under concurrency; roll the claim back if it overfilled
  const { count: newCount } = await db
    .from("participants")
    .select("id", { count: "exact", head: true })
    .eq("team_id", parsed.data.teamId);
  if ((newCount ?? 0) > 3) {
    await db
      .from("participants")
      .update({ team_id: null, role: "solo" })
      .eq("id", parsed.data.participantId);
    return { ok: false, error: "That team just filled up. Refresh and retry." };
  }

  await logAudit(admin.id, "draft.add_solo", team.team_code as string, {
    participant: parsed.data.participantId,
  });
  revalidatePath("/admin/draft");
  revalidatePath("/admin/teams");
  return { ok: true, code: team.team_code as string };
}

/**
 * Reject a solo free-agent: email them the rejection, then mark them rejected so
 * they drop out of the draft pool. Super-admin only (sending email), and the
 * applicant is only marked rejected once the email actually sends.
 */
export async function rejectSolo(participantId: string): Promise<SoloResult> {
  let admin;
  try {
    admin = await assertRole("super_admin");
  } catch (e) {
    if (e instanceof ForbiddenError)
      return { ok: false, error: "Only super-admins can reject applicants." };
    throw e;
  }

  const parsed = z.string().uuid().safeParse(participantId);
  if (!parsed.success) return { ok: false, error: GENERIC };
  if (!isEmailConfigured()) return { ok: false, error: NOT_CONFIGURED };

  const db = supabaseServer();
  const { data: p } = await db
    .from("participants")
    .select("id, full_name, email, team_id, rejected_at")
    .eq("id", parsed.data)
    .maybeSingle();
  if (!p) return { ok: false, error: "Applicant not found." };
  if (p.team_id)
    return { ok: false, error: "That applicant is already on a team." };
  if (p.rejected_at) return { ok: true }; // already rejected — idempotent no-op

  const to = p.email as string;
  const name = p.full_name as string;
  const { subject, html, attachments } = await renderEmail(
    "rejection",
    { teamName: name, code: "", leaderName: name },
    { mode: "send" },
  );

  const { data: row } = await db
    .from("emails")
    .insert({
      team_id: null,
      to_email: to,
      template: "rejection",
      status: "queued",
      sent_by: admin.id,
    })
    .select("id")
    .single();
  const rowId = row?.id as string | undefined;

  try {
    const messageId = await sendMail({
      to,
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
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (rowId)
      await db
        .from("emails")
        .update({ status: "failed", error: message })
        .eq("id", rowId);
    return { ok: false, error: "Send failed. See the email log." };
  }

  // mark rejected only after a successful send
  await db
    .from("participants")
    .update({ rejected_at: new Date().toISOString(), rejected_by: admin.id })
    .eq("id", parsed.data);

  await logAudit(admin.id, "solo.reject", null, { participant: parsed.data, to });
  revalidatePath("/admin/draft");
  return { ok: true };
}
