// Server-side answer validation against a form definition. Returns a cleaned
// answers map (only known questions, coerced to the right shape) or an error.
import type { Answers, AnswerValue, FeedbackForm, Question } from "./questions";

const TEXT_MAX = 2000;

export type ValidateResult =
  | { ok: true; answers: Answers }
  | { ok: false; error: string };

// A single answer is either an error, a cleaned value to store, or skipped
// (optional + not answered). A discriminated result is used deliberately: a
// valid single-choice / text answer is itself a string, so "string == error"
// sentinels would misread answers like "Yes" as an error message.
type OneResult =
  | { error: string }
  | { value: AnswerValue }
  | { skip: true };

function validateOne(q: Question, raw: unknown): OneResult {
  const missing = (): OneResult =>
    q.required ? { error: `Please answer: ${q.label}` } : { skip: true };

  switch (q.type) {
    case "rating":
    case "nps": {
      if (raw === undefined || raw === null || raw === "") return missing();
      const n = typeof raw === "number" ? raw : Number(raw);
      const s = q.scale!;
      if (!Number.isFinite(n) || !Number.isInteger(n) || n < s.min || n > s.max) {
        return { error: `Invalid value for: ${q.label}` };
      }
      return { value: n };
    }
    case "single": {
      if (raw === undefined || raw === null || raw === "") return missing();
      if (typeof raw !== "string" || !q.options!.includes(raw)) {
        return { error: `Invalid choice for: ${q.label}` };
      }
      return { value: raw };
    }
    case "multi": {
      const arr = Array.isArray(raw) ? raw : [];
      const clean = arr.filter(
        (v): v is string => typeof v === "string" && q.options!.includes(v),
      );
      if (clean.length === 0) return missing();
      // de-duplicate, preserve option order
      return { value: q.options!.filter((o) => clean.includes(o)) };
    }
    case "text": {
      const str = typeof raw === "string" ? raw.trim() : "";
      if (str.length === 0) return missing();
      return { value: str.slice(0, TEXT_MAX) };
    }
  }
}

export function validateAnswers(
  form: FeedbackForm,
  input: unknown,
): ValidateResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "Invalid submission." };
  }
  const src = input as Record<string, unknown>;
  const answers: Answers = {};

  for (const q of form.questions) {
    const result = validateOne(q, src[q.id]);
    if ("error" in result) return { ok: false, error: result.error };
    if ("value" in result) answers[q.id] = result.value;
  }

  return { ok: true, answers };
}
