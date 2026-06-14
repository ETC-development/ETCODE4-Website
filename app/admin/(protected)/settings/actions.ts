"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertRole, ForbiddenError, type AdminRole } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { logAudit } from "@/lib/admin/audit";
import { createAuthUser, deleteAuthUser } from "@/lib/admin/gotrue";

export type ActionResult = { ok: true } | { ok: false; error: string };

// Node.js runtime (GoTrue admin fetch) is pinned on settings/page.tsx — a
// "use server" file can't export route-segment config itself.

const FORBIDDEN = "Only the super-admin can change settings.";
const GENERIC = "Something went wrong. Try again.";
const ROLES = ["super_admin", "manager", "hr_checkin"] as const;

async function guard() {
  return assertRole("super_admin");
}
function denied(e: unknown): ActionResult {
  if (e instanceof ForbiddenError) return { ok: false, error: FORBIDDEN };
  throw e;
}

// --- event settings ---------------------------------------------------------

export async function updateSettings(
  registrationOpen: boolean,
  maxTeamsRaw: string,
): Promise<ActionResult> {
  let admin;
  try {
    admin = await guard();
  } catch (e) {
    return denied(e);
  }
  const parsed = z
    .object({
      registrationOpen: z.boolean(),
      maxTeams: z
        .union([z.literal(""), z.coerce.number().int().min(0).max(100000)])
        .optional(),
    })
    .safeParse({ registrationOpen, maxTeams: maxTeamsRaw });
  if (!parsed.success) return { ok: false, error: GENERIC };

  const max_teams =
    parsed.data.maxTeams === "" || parsed.data.maxTeams === undefined
      ? null
      : parsed.data.maxTeams;

  const db = supabaseServer();
  const { error } = await db
    .from("settings")
    .upsert({
      id: 1,
      registration_open: parsed.data.registrationOpen,
      max_teams,
      updated_at: new Date().toISOString(),
    });
  if (error) return { ok: false, error: GENERIC };

  await logAudit(admin.id, "settings.update", null, {
    registration_open: parsed.data.registrationOpen,
    max_teams,
  });
  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  return { ok: true };
}

// --- admin management -------------------------------------------------------

export async function addAdmin(
  email: string,
  fullName: string,
  role: string,
  password: string,
): Promise<ActionResult> {
  let admin;
  try {
    admin = await guard();
  } catch (e) {
    return denied(e);
  }
  const parsed = z
    .object({
      email: z.email(),
      fullName: z.string().trim().max(80).optional().or(z.literal("")),
      role: z.enum(ROLES),
      password: z.string().min(8, "Password must be at least 8 characters."),
    })
    .safeParse({ email, fullName, role, password });
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? GENERIC,
    };

  const created = await createAuthUser(parsed.data.email, parsed.data.password);
  if ("error" in created)
    return {
      ok: false,
      error:
        created.error === "already_exists"
          ? "An account with that email already exists."
          : "Couldn't create the account.",
    };

  const db = supabaseServer();
  const { error } = await db.from("admins").upsert(
    {
      id: created.id,
      email: parsed.data.email.toLowerCase(),
      full_name: parsed.data.fullName || null,
      role: parsed.data.role,
    },
    { onConflict: "id" },
  );
  if (error) return { ok: false, error: GENERIC };

  await logAudit(admin.id, "admin.add", parsed.data.email, {
    role: parsed.data.role,
  });
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function setAdminRole(
  id: string,
  role: string,
): Promise<ActionResult> {
  let admin;
  try {
    admin = await guard();
  } catch (e) {
    return denied(e);
  }
  const parsed = z
    .object({ id: z.string().uuid(), role: z.enum(ROLES) })
    .safeParse({ id, role });
  if (!parsed.success) return { ok: false, error: GENERIC };

  // never let a super-admin demote themselves (lockout guard)
  if (parsed.data.id === admin.id && parsed.data.role !== "super_admin")
    return {
      ok: false,
      error: "You can't change your own role. Ask another super-admin.",
    };

  const db = supabaseServer();
  const { error } = await db
    .from("admins")
    .update({ role: parsed.data.role as AdminRole })
    .eq("id", parsed.data.id);
  if (error) return { ok: false, error: GENERIC };

  await logAudit(admin.id, "admin.role", parsed.data.id, {
    role: parsed.data.role,
  });
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function removeAdmin(id: string): Promise<ActionResult> {
  let admin;
  try {
    admin = await guard();
  } catch (e) {
    return denied(e);
  }
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { ok: false, error: GENERIC };
  if (parsed.data === admin.id)
    return { ok: false, error: "You can't remove your own account." };

  // deleting the auth user cascades the admins row (FK on delete cascade)
  const ok = await deleteAuthUser(parsed.data);
  if (!ok) return { ok: false, error: "Couldn't remove that account." };

  await logAudit(admin.id, "admin.remove", parsed.data);
  revalidatePath("/admin/settings");
  return { ok: true };
}
