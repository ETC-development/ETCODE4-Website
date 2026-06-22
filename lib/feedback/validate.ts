// Server-side answer validation against a form definition. Returns a cleaned
// answers map (only known questions, coerced to the right shape) or an error.
import type { Answers, AnswerValue, FeedbackForm, Question } from "./questions";

const TEXT_MAX = 2000;

export type ValidateResult =
  | { ok: true; answers: Answers }
  | { ok: false; error: string };

function validateOne(q: Question, raw: unknown): AnswerValue | null | string {
  // returns: cleaned value | null (skip, not answered) | string (error message)
  const missing = `Please answer: ${q.label}`;

  switch (q.type) {
    case "rating":
    case "nps": {
      if (raw === undefined || raw === null || raw === "") {
        return q.required ? missing : null;
      }
      const n = typeof raw === "number" ? raw : Number(raw);
      const s = q.scale!;
      if (!Number.isFinite(n) || !Number.isInteger(n) || n < s.min || n > s.max) {
        return `Invalid value for: ${q.label}`;
      }
      return n;
    }
    case "single": {
      if (raw === undefined || raw === null || raw === "") {
        return q.required ? missing : null;
      }
      if (typeof raw !== "string" || !q.options!.includes(raw)) {
        return `Invalid choice for: ${q.label}`;
      }
      return raw;
    }
    case "multi": {
      const arr = Array.isArray(raw) ? raw : [];
      const clean = arr.filter(
        (v): v is string => typeof v === "string" && q.options!.includes(v),
      );
      if (clean.length === 0) return q.required ? missing : null;
      // de-duplicate, preserve option order
      return q.options!.filter((o) => clean.includes(o));
    }
    case "text": {
      const str = typeof raw === "string" ? raw.trim() : "";
      if (str.length === 0) return q.required ? missing : null;
      return str.slice(0, TEXT_MAX);
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
    if (typeof result === "string") return { ok: false, error: result };
    if (result !== null) answers[q.id] = result;
  }

  return { ok: true, answers };
}
