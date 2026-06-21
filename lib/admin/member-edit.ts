// Pure validation for super-admin member edits — no server-only deps, so it's
// unit-testable in isolation and shared by the server action.
import { z } from "zod";

/** Optional free-text field: trim, and treat empty as "cleared" (null). */
const optionalText = z
  .string()
  .trim()
  .max(200)
  .transform((s) => (s.length ? s : null))
  .nullable()
  .optional()
  .transform((s) => s ?? null);

export const memberEditSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email.").max(200),
  phone: optionalText,
  institution: optionalText,
  study_year: optionalText,
  leetcode: optionalText,
  hackerrank: optionalText,
  github: optionalText,
  motivation: z
    .string()
    .trim()
    .max(2000)
    .transform((s) => (s.length ? s : null))
    .nullable()
    .optional()
    .transform((s) => s ?? null),
  tshirt_size: optionalText,
});

/** The shape the client sends and the action persists (after parsing). */
export type MemberEditFields = z.input<typeof memberEditSchema>;
export type MemberEditValues = z.output<typeof memberEditSchema>;
