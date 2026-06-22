import "server-only";
import { supabaseSession } from "@/lib/supabase/session";
import {
  getForm,
  type Answers,
  type ContributorRole,
  type Question,
} from "@/lib/feedback/questions";
import type { Cat } from "./dashboard";

// ===========================================================================
// Aggregation: turn raw answer maps into chart-ready stats per question.
// ===========================================================================
export type QStat =
  | {
      id: string;
      label: string;
      kind: "scale";
      type: "rating" | "nps";
      count: number;
      avg: number | null;
      distribution: Cat[]; // one bucket per scale point
      nps: { promoters: number; passives: number; detractors: number; score: number } | null;
    }
  | {
      id: string;
      label: string;
      kind: "choice";
      type: "single" | "multi";
      count: number; // respondents who answered
      options: Cat[];
    }
  | {
      id: string;
      label: string;
      kind: "text";
      type: "text";
      count: number;
      responses: string[];
    };

function scaleStat(q: Question, values: number[]): QStat {
  const s = q.scale!;
  const counts = new Map<number, number>();
  for (let i = s.min; i <= s.max; i++) counts.set(i, 0);
  let sum = 0;
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
    sum += v;
  }
  const count = values.length;
  const distribution: Cat[] = [...counts.entries()].map(([k, v]) => ({
    name: String(k),
    value: v,
  }));

  let nps: { promoters: number; passives: number; detractors: number; score: number } | null = null;
  if (q.type === "nps" && count > 0) {
    const promoters = values.filter((v) => v >= 9).length;
    const detractors = values.filter((v) => v <= 6).length;
    const passives = count - promoters - detractors;
    nps = {
      promoters,
      passives,
      detractors,
      score: Math.round(((promoters - detractors) / count) * 100),
    };
  }

  return {
    id: q.id,
    label: q.label,
    kind: "scale",
    type: q.type as "rating" | "nps",
    count,
    avg: count ? Math.round((sum / count) * 100) / 100 : null,
    distribution,
    nps,
  };
}

function choiceStat(q: Question, answers: Answers[]): QStat {
  const counts = new Map<string, number>();
  for (const o of q.options!) counts.set(o, 0);
  let count = 0;
  for (const a of answers) {
    const v = a[q.id];
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      if (v.length === 0) continue;
      count++;
      for (const o of v) counts.set(o, (counts.get(o) ?? 0) + 1);
    } else if (typeof v === "string") {
      count++;
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
  }
  return {
    id: q.id,
    label: q.label,
    kind: "choice",
    type: q.type as "single" | "multi",
    count,
    options: q.options!.map((o) => ({ name: o, value: counts.get(o) ?? 0 })),
  };
}

function textStat(q: Question, answers: Answers[]): QStat {
  const responses = answers
    .map((a) => a[q.id])
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim());
  return {
    id: q.id,
    label: q.label,
    kind: "text",
    type: "text",
    count: responses.length,
    responses: responses.slice(0, 300),
  };
}

function statFor(q: Question, answers: Answers[]): QStat {
  if (q.type === "rating" || q.type === "nps") {
    const values = answers
      .map((a) => a[q.id])
      .filter((v): v is number => typeof v === "number");
    return scaleStat(q, values);
  }
  if (q.type === "text") return textStat(q, answers);
  return choiceStat(q, answers);
}

function statsForForm(
  questions: Question[],
  answers: Answers[],
): QStat[] {
  return questions.map((q) => statFor(q, answers));
}

// ===========================================================================
// Page data: response rates, contributor roster, pending lists, analytics.
// ===========================================================================
export type SendCounts = { invited: number; submitted: number; total: number };

export type ContributorRow = {
  id: string;
  full_name: string;
  email: string;
  role: ContributorRole;
  sent: boolean;
  submitted: boolean;
};

export type PendingPerson = { id: string; name: string; email: string };
export type PendingContributor = PendingPerson & { role: ContributorRole };

export type FeedbackAdminData = {
  participants: SendCounts;
  contributors: { organizer: SendCounts; mentor: SendCounts };
  contributorRows: ContributorRow[];
  pendingParticipants: PendingPerson[];
  pendingContributors: PendingContributor[];
  analytics: {
    participant: QStat[];
    organizer: QStat[];
    mentor: QStat[];
    participantResponses: number;
    organizerResponses: number;
    mentorResponses: number;
  };
};

export async function getFeedbackAdminData(): Promise<FeedbackAdminData> {
  const sb = await supabaseSession();

  const [{ data: parts }, { data: contribs }, { data: responses }] =
    await Promise.all([
      sb
        .from("participants")
        .select(
          "id, full_name, email, feedback_sent_at, feedback_submitted_at, team:teams(status)",
        ),
      sb
        .from("contributors")
        .select(
          "id, full_name, email, role, feedback_sent_at, feedback_submitted_at",
        )
        .order("created_at", { ascending: true }),
      sb.from("feedback_responses").select("audience, role, answers"),
    ]);

  // --- participants (accepted only) ---
  const acceptedParts = ((parts ?? []) as {
    id: string;
    full_name: string;
    email: string;
    feedback_sent_at: string | null;
    feedback_submitted_at: string | null;
    team: { status: string } | { status: string }[] | null;
  }[]).filter((p) => {
    const team = Array.isArray(p.team) ? p.team[0] : p.team;
    return team?.status === "accepted";
  });

  const participants: SendCounts = {
    total: acceptedParts.length,
    invited: acceptedParts.filter((p) => p.feedback_sent_at).length,
    submitted: acceptedParts.filter((p) => p.feedback_submitted_at).length,
  };
  const pendingParticipants: PendingPerson[] = acceptedParts
    .filter((p) => !p.feedback_sent_at)
    .map((p) => ({ id: p.id, name: p.full_name, email: p.email }));

  // --- contributors ---
  const contributorRows: ContributorRow[] = (
    (contribs ?? []) as {
      id: string;
      full_name: string;
      email: string;
      role: ContributorRole;
      feedback_sent_at: string | null;
      feedback_submitted_at: string | null;
    }[]
  ).map((c) => ({
    id: c.id,
    full_name: c.full_name,
    email: c.email,
    role: c.role,
    sent: !!c.feedback_sent_at,
    submitted: !!c.feedback_submitted_at,
  }));

  const roleCounts = (role: ContributorRole): SendCounts => {
    const rows = contributorRows.filter((c) => c.role === role);
    return {
      total: rows.length,
      invited: rows.filter((c) => c.sent).length,
      submitted: rows.filter((c) => c.submitted).length,
    };
  };
  const pendingContributors: PendingContributor[] = contributorRows
    .filter((c) => !c.sent)
    .map((c) => ({ id: c.id, name: c.full_name, email: c.email, role: c.role }));

  // --- analytics ---
  const rows = (responses ?? []) as {
    audience: string;
    role: string | null;
    answers: Answers;
  }[];
  const participantAnswers = rows
    .filter((r) => r.audience === "participant")
    .map((r) => r.answers);
  const organizerAnswers = rows
    .filter((r) => r.audience === "contributor" && r.role === "organizer")
    .map((r) => r.answers);
  const mentorAnswers = rows
    .filter((r) => r.audience === "contributor" && r.role === "mentor")
    .map((r) => r.answers);

  return {
    participants,
    contributors: { organizer: roleCounts("organizer"), mentor: roleCounts("mentor") },
    contributorRows,
    pendingParticipants,
    pendingContributors,
    analytics: {
      participant: statsForForm(getForm("participant", null).questions, participantAnswers),
      organizer: statsForForm(getForm("contributor", "organizer").questions, organizerAnswers),
      mentor: statsForForm(getForm("contributor", "mentor").questions, mentorAnswers),
      participantResponses: participantAnswers.length,
      organizerResponses: organizerAnswers.length,
      mentorResponses: mentorAnswers.length,
    },
  };
}
