import { z } from "zod";

export const INSTITUTIONS = [
  "ENSIA",
  "USTHB",
  "ESI Alger",
  "ESI SBA",
  "ESTIN",
  "NSCS",
  "Other",
] as const;

export const STUDY_YEARS = [
  "1st year",
  "2nd year",
  "3rd year",
  "4th year",
  "5th year",
  "Alumni / Other",
] as const;

export const TSHIRT_SIZES = ["S", "M", "L", "XL", "XXL"] as const;

const required = (label: string) => `${label} is required.`;

const optionalUrl = z
  .union([z.literal(""), z.url("Enter a full URL (https://…).")])
  .optional();

export const participantBase = z.object({
  full_name: z.string().trim().min(2, required("Full name")).max(80, "That name is too long."),
  email: z.email("Enter a valid email address.").max(120),
  phone: z.string().trim().min(6, required("Phone")).max(20, "That phone number is too long."),
  institution: z.enum(INSTITUTIONS, { message: "Pick your institution." }),
  institution_other: z.string().trim().max(120).optional().or(z.literal("")),
  study_year: z.enum(STUDY_YEARS, { message: "Pick your study year." }),
  leetcode: optionalUrl,
  hackerrank: optionalUrl,
  github: optionalUrl,
  tshirt_size: z.enum(TSHIRT_SIZES).optional().or(z.literal("")),
  website: z.string().max(0).optional().or(z.literal("")),
});

export type Participant = z.infer<typeof participantBase>;

function refineInstitution(data: Participant, ctx: z.RefinementCtx) {
  if (data.institution === "Other" && !(data.institution_other ?? "").trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["institution_other"],
      message: "Tell us which institution.",
    });
  }
}

const motivation = z
  .string()
  .trim()
  .min(10, "Tell us in a sentence or two why you're in.")
  .max(600, "Keep it under 600 characters.");

export const soloSchema = participantBase
  .extend({ motivation })
  .superRefine(refineInstitution);
export type SoloValues = z.infer<typeof soloSchema>;

export const createTeamSchema = participantBase
  .extend({
    team_name: z.string().trim().min(2, required("Team name")).max(60, "That team name is too long."),
    motivation,
  })
  .superRefine(refineInstitution);
export type CreateTeamValues = z.infer<typeof createTeamSchema>;

export const joinTeamSchema = participantBase
  .extend({
    team_code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^ET4-[A-Z0-9]{5}$/, "Team codes look like ET4-7KQ2X."),
  })
  .superRefine(refineInstitution);
export type JoinTeamValues = z.infer<typeof joinTeamSchema>;

export const TEAM_CODE_RE = /^ET4-[A-Z0-9]{5}$/;
