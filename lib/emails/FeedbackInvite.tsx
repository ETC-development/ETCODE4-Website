import { Button, Section, Text } from "@react-email/components";
import { C, DISPLAY_FONT, Eyebrow, Layout, P, Title } from "./Layout";

export type FeedbackInviteProps = {
  recipientName: string;
  // "participant" softens the ask; "organizer"/"mentor" thanks them for helping
  audienceLabel: "participant" | "organizer" | "mentor";
  feedbackUrl: string;
  deadline?: string | null; // e.g. "29 June 2026"
  logoUrl?: string;
  contactEmail: string;
};

const COPY: Record<
  FeedbackInviteProps["audienceLabel"],
  { eyebrow: string; title: string; lead: string }
> = {
  participant: {
    eyebrow: "ETCODE 4 · Feedback",
    title: "How did we do?",
    lead: "ETCODE 4 is a wrap, and you were on the floor. Your honest take is what shapes the next edition.",
  },
  organizer: {
    eyebrow: "ETCODE 4 · Contributor feedback",
    title: "You helped run it.",
    lead: "Thank you for organizing ETCODE 4. Now tell us what worked and what slowed you down, candidly.",
  },
  mentor: {
    eyebrow: "ETCODE 4 · Contributor feedback",
    title: "You guided the floor.",
    lead: "Thank you for mentoring at ETCODE 4. Your view from beside the players is exactly what we need.",
  },
};

export default function FeedbackInvite({
  recipientName,
  audienceLabel,
  feedbackUrl,
  deadline,
  logoUrl,
  contactEmail,
}: FeedbackInviteProps) {
  const copy = COPY[audienceLabel];
  return (
    <Layout
      preview="Tell us how ETCODE 4 went — it takes about 3 minutes."
      contactEmail={contactEmail}
      logoUrl={logoUrl}
    >
      <Eyebrow>{copy.eyebrow}</Eyebrow>
      <Title>{copy.title}</Title>

      <P>Hi {recipientName.split(" ")[0] || "there"},</P>
      <P>{copy.lead}</P>
      <P>
        The form is short (about 3 minutes) and completely{" "}
        <strong style={{ color: C.bone }}>anonymous</strong> — your answers are
        never linked back to you.
      </P>

      <Section style={{ padding: "8px 0 4px" }}>
        <Button
          href={feedbackUrl}
          style={{
            backgroundColor: C.orange,
            color: C.court,
            fontFamily: DISPLAY_FONT,
            fontSize: "15px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "13px 26px",
            borderRadius: "10px",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Give your feedback →
        </Button>
      </Section>

      {deadline ? (
        <Text style={{ margin: "16px 0 0", fontSize: "13px", color: C.muted }}>
          Please answer before <strong style={{ color: C.chalk }}>{deadline}</strong>.
        </Text>
      ) : null}

      <Text style={{ margin: "16px 0 0", fontSize: "12px", color: C.muted }}>
        Button not working? Copy this link:{" "}
        <span style={{ color: C.chalk }}>{feedbackUrl}</span>
      </Text>
    </Layout>
  );
}
