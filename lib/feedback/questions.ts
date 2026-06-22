// Feedback question definitions — the single source of truth for both the
// public form (rendering + validation) and the admin analytics (aggregation).
// No `server-only`: this module is imported by the client form too.

export type Audience = "participant" | "contributor";
export type ContributorRole = "organizer" | "mentor";

export type QuestionType = "rating" | "nps" | "single" | "multi" | "text";

export type Scale = {
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
};

export type Question = {
  id: string;
  type: QuestionType;
  label: string;
  required?: boolean;
  /** single / multi */
  options?: string[];
  /** rating / nps */
  scale?: Scale;
  /** visual grouping of consecutive rating rows (the "matrix") */
  group?: string;
  /** section heading shown above this question */
  section?: string;
  /** placeholder for text questions */
  placeholder?: string;
};

export type FeedbackForm = {
  audience: Audience;
  role: ContributorRole | null;
  title: string;
  intro: string;
  questions: Question[];
};

export type AnswerValue = number | string | string[];
export type Answers = Record<string, AnswerValue>;

const RATING: Scale = { min: 1, max: 5, minLabel: "Poor", maxLabel: "Excellent" };
const NPS: Scale = { min: 0, max: 10, minLabel: "Not likely", maxLabel: "Very likely" };

// ---------------------------------------------------------------------------
// Participant form (accepted attendees)
// ---------------------------------------------------------------------------
const PARTICIPANT_QUESTIONS: Question[] = [
  {
    id: "nps",
    type: "nps",
    label: "How likely are you to recommend ETCODE to a friend or classmate?",
    scale: NPS,
    required: true,
    section: "The big picture",
  },
  {
    id: "overall_satisfaction",
    type: "rating",
    label: "Overall, how satisfied were you with ETCODE 4?",
    scale: RATING,
    required: true,
  },
  {
    id: "met_expectations",
    type: "rating",
    label: "How well did the event meet your expectations?",
    scale: RATING,
    required: true,
  },
  // rating matrix — one row per aspect, grouped for display
  { id: "aspect_problems", type: "rating", label: "Problem / challenge quality", scale: RATING, required: true, section: "Rate each part of the experience", group: "aspects" },
  { id: "aspect_difficulty", type: "rating", label: "Difficulty balance", scale: RATING, required: true, group: "aspects" },
  { id: "aspect_organization", type: "rating", label: "Organization & communication", scale: RATING, required: true, group: "aspects" },
  { id: "aspect_venue", type: "rating", label: "Venue & facilities", scale: RATING, required: true, group: "aspects" },
  { id: "aspect_food", type: "rating", label: "Food & catering", scale: RATING, required: true, group: "aspects" },
  { id: "aspect_mentorship", type: "rating", label: "Mentorship & support", scale: RATING, required: true, group: "aspects" },
  { id: "aspect_schedule", type: "rating", label: "Schedule & timing", scale: RATING, required: true, group: "aspects" },
  { id: "aspect_platform", type: "rating", label: "Registration & judging platform", scale: RATING, required: true, group: "aspects" },
  {
    id: "difficulty_level",
    type: "single",
    label: "How was the difficulty of the problem set for your team?",
    options: ["Too easy", "Just right", "Too hard"],
    required: true,
    section: "A few specifics",
  },
  {
    id: "best_part",
    type: "multi",
    label: "What were the best parts? (pick all that apply)",
    options: [
      "The challenges",
      "The atmosphere",
      "Networking & meeting people",
      "Prizes & rewards",
      "Mentors & support",
      "Learning something new",
      "Organization",
    ],
    required: true,
  },
  {
    id: "return_intent",
    type: "single",
    label: "Will you take part in the next edition?",
    options: ["Yes", "Maybe", "No"],
    required: true,
  },
  {
    id: "discovery_channel",
    type: "single",
    label: "How did you first hear about ETCODE?",
    options: ["Instagram", "A friend", "ENSIA / a club", "A professor", "LinkedIn", "Other"],
    required: true,
  },
  {
    id: "enjoyed_most",
    type: "text",
    label: "What did you enjoy the most?",
    placeholder: "The moment, problem, or part that stood out…",
    section: "In your own words",
  },
  {
    id: "improve_most",
    type: "text",
    label: "What is the #1 thing we should improve next time?",
    placeholder: "Be honest — this is the most useful answer you can give us.",
    required: true,
  },
  {
    id: "issues",
    type: "text",
    label: "Any technical or logistical problems you ran into?",
    placeholder: "Optional — leave blank if everything ran smoothly.",
  },
];

// ---------------------------------------------------------------------------
// Contributor form: shared core + role-specific block
// ---------------------------------------------------------------------------
const CONTRIBUTOR_CORE: Question[] = [
  {
    id: "overall_experience",
    type: "rating",
    label: "Overall, how was your experience as a contributor?",
    scale: RATING,
    required: true,
    section: "The big picture",
  },
  {
    id: "organization_quality",
    type: "rating",
    label: "How well was the event organized overall?",
    scale: RATING,
    required: true,
  },
  {
    id: "core_communication",
    type: "rating",
    label: "How clear was communication from the core team?",
    scale: RATING,
    required: true,
  },
  {
    id: "nps",
    type: "nps",
    label: "How likely are you to recommend contributing to ETCODE to others?",
    scale: NPS,
    required: true,
  },
  {
    id: "contribute_again",
    type: "single",
    label: "Would you contribute again next edition?",
    options: ["Yes", "Maybe", "No"],
    required: true,
  },
];

const ORGANIZER_BLOCK: Question[] = [
  {
    id: "org_workload",
    type: "single",
    label: "How was your workload?",
    options: ["Too light", "Balanced", "Too heavy"],
    required: true,
    section: "Your role: organizer",
  },
  { id: "org_role_clarity", type: "rating", label: "Were your role & responsibilities clear?", scale: RATING, required: true },
  { id: "org_tools", type: "rating", label: "Were the tools & resources adequate?", scale: RATING, required: true },
  { id: "org_coordination", type: "rating", label: "How was coordination across teams?", scale: RATING, required: true },
  {
    id: "org_bottleneck",
    type: "text",
    label: "What was the biggest bottleneck you faced?",
    placeholder: "Where did things slow down or get blocked?",
    section: "In your own words",
  },
  { id: "org_keep", type: "text", label: "What should we definitely keep doing?", placeholder: "Optional" },
];

const MENTOR_BLOCK: Question[] = [
  {
    id: "mentor_skill_vs_expectation",
    type: "single",
    label: "How did participants' skill level compare to your expectation?",
    options: ["Lower than expected", "As expected", "Higher than expected"],
    required: true,
    section: "Your role: mentor",
  },
  { id: "mentor_briefed", type: "rating", label: "Were you briefed/equipped enough to mentor effectively?", scale: RATING, required: true },
  { id: "mentor_materials", type: "rating", label: "Quality of the problem briefs / mentoring materials", scale: RATING, required: true },
  { id: "mentor_interaction", type: "rating", label: "How was your interaction with participants?", scale: RATING, required: true },
  {
    id: "mentor_support",
    type: "text",
    label: "What support did you wish you had?",
    placeholder: "Anything that would have made mentoring easier.",
    section: "In your own words",
  },
  { id: "mentor_suggestions", type: "text", label: "Suggestions for mentors next year?", placeholder: "Optional" },
];

// ---------------------------------------------------------------------------
// Form resolution
// ---------------------------------------------------------------------------
export function getForm(
  audience: Audience,
  role: ContributorRole | null,
): FeedbackForm {
  if (audience === "participant") {
    return {
      audience,
      role: null,
      title: "Tell us how we did",
      intro:
        "ETCODE 4 is a wrap. Your honest feedback shapes the next edition — it takes about 3 minutes and it's completely anonymous.",
      questions: PARTICIPANT_QUESTIONS,
    };
  }
  const block = role === "mentor" ? MENTOR_BLOCK : ORGANIZER_BLOCK;
  return {
    audience: "contributor",
    role: role ?? "organizer",
    title: "Your contributor feedback",
    intro:
      "Thank you for helping run ETCODE 4. Tell us what worked and what didn't — it's anonymous and takes about 3 minutes.",
    questions: [...CONTRIBUTOR_CORE, ...block],
  };
}

/** All forms, for analytics that needs the full question registry. */
export const ALL_FORMS: FeedbackForm[] = [
  getForm("participant", null),
  getForm("contributor", "organizer"),
  getForm("contributor", "mentor"),
];
