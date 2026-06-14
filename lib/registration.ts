import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { EVENT } from "@/lib/content";

export type RegistrationStatus = {
  open: boolean;
  closedReason: "manual" | "deadline" | null;
  deadlineISO: string;
};

/**
 * Single source of truth for whether public registration is open: the
 * super-admin toggle (settings.registration_open) AND the deadline. Either one
 * being closed/past closes registration. Used by the public /register UI and by
 * the server-action write gate, so the two can never disagree.
 */
export async function getRegistrationStatus(): Promise<RegistrationStatus> {
  let manualOpen = true;
  try {
    const db = supabaseServer();
    const { data } = await db
      .from("settings")
      .select("registration_open")
      .eq("id", 1)
      .maybeSingle();
    manualOpen = data?.registration_open !== false;
  } catch {
    // not configured yet — treat as open (registration just isn't wired)
  }

  const pastDeadline =
    Date.now() > new Date(EVENT.registrationDeadlineISO).getTime();

  return {
    open: manualOpen && !pastDeadline,
    closedReason: !manualOpen ? "manual" : pastDeadline ? "deadline" : null,
    deadlineISO: EVENT.registrationDeadlineISO,
  };
}
