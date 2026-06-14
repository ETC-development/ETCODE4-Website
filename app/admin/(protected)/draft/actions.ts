"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertRole, ForbiddenError } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { genTeamCode } from "@/lib/utils";
import { logAudit } from "@/lib/admin/audit";

export type DraftResult =
  | { ok: true; code: string }
  | { ok: false; error: string };

const GENERIC = "Something went wrong. Try again.";
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
