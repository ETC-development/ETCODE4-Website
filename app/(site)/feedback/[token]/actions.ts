"use server";

import { hit, clientKey } from "@/lib/rate-limit";
import { getForm } from "@/lib/feedback/questions";
import { validateAnswers } from "@/lib/feedback/validate";
import { lookupToken, recordSubmission } from "@/lib/feedback/server";

export type SubmitResult =
  | { ok: true }
  | { ok: false; error: string; already?: boolean };

const GENERIC = "Something went wrong. Please try again in a moment.";

export async function submitFeedback(
  token: string,
  rawAnswers: unknown,
): Promise<SubmitResult> {
  if (!hit(await clientKey("feedback"), 10, 60_000)) {
    return { ok: false, error: "Too many attempts. Take a breather and try again in a minute." };
  }

  const who = await lookupToken(token);
  if (!who.found) return { ok: false, error: "This feedback link isn't valid." };
  if (!who.eligible) {
    return { ok: false, error: "This feedback form isn't available for your link." };
  }
  if (who.submitted) {
    return { ok: false, error: "You've already submitted your feedback. Thank you!", already: true };
  }

  const form = getForm(who.audience, who.role);
  const validated = validateAnswers(form, rawAnswers);
  if (!validated.ok) return { ok: false, error: validated.error };

  const res = await recordSubmission(token, who.audience, who.role, validated.answers);
  if (!res.ok) {
    if (res.reason === "already") {
      return { ok: false, error: "You've already submitted your feedback. Thank you!", already: true };
    }
    return { ok: false, error: GENERIC };
  }
  return { ok: true };
}
