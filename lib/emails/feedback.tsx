import "server-only";
import { render } from "@react-email/render";
import { EVENT } from "@/lib/content";
import FeedbackInvite from "./FeedbackInvite";

// Standalone renderer for feedback invites. Kept separate from the team-centric
// render.tsx pipeline: feedback emails are per-person (participant or
// contributor), carry no QR attachments, and target an opaque feedback token.

export type FeedbackAudienceLabel = "participant" | "organizer" | "mentor";

export const FEEDBACK_SUBJECT: Record<FeedbackAudienceLabel, string> = {
  participant: `${EVENT.name}, tell us how we did`,
  organizer: `${EVENT.name}, your contributor feedback`,
  mentor: `${EVENT.name}, your contributor feedback`,
};

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://etcode4.vercel.app"
  );
}

export function feedbackUrl(token: string): string {
  return `${siteUrl()}/feedback/${encodeURIComponent(token)}`;
}

function logoUrl(): string {
  return `${siteUrl()}/brand/etc-white.png`;
}

export async function renderFeedbackEmail(opts: {
  audienceLabel: FeedbackAudienceLabel;
  recipientName: string;
  token: string;
  deadline?: string | null;
  subject?: string;
}): Promise<{ subject: string; html: string }> {
  const subject = opts.subject?.trim() || FEEDBACK_SUBJECT[opts.audienceLabel];
  const html = await render(
    <FeedbackInvite
      recipientName={opts.recipientName}
      audienceLabel={opts.audienceLabel}
      feedbackUrl={feedbackUrl(opts.token)}
      deadline={opts.deadline ?? null}
      logoUrl={logoUrl()}
      contactEmail={EVENT.contactEmail}
    />,
  );
  return { subject, html };
}
