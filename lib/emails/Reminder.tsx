import { Button, Section, Text } from "@react-email/components";
import { C, Eyebrow, Layout, P, Title } from "./Layout";

export type ReminderProps = {
  teamName: string;
  leaderName: string;
  eventDates: string;
  venue: string;
  statusUrl: string;
  logoUrl?: string;
  contactEmail: string;
};

export default function Reminder({
  teamName,
  leaderName,
  eventDates,
  venue,
  statusUrl,
  logoUrl,
  contactEmail,
}: ReminderProps) {
  return (
    <Layout
      preview={`ETCODE 4 is almost here. ${teamName}`}
      contactEmail={contactEmail}
      logoUrl={logoUrl}
    >
      <Eyebrow>Tip-off soon</Eyebrow>
      <Title>It&apos;s almost game time.</Title>

      <P>Hi {leaderName.split(" ")[0] || "there"},</P>
      <P>
        ETCODE 4 is around the corner and team{" "}
        <strong style={{ color: C.bone }}>{teamName}</strong> is on the roster.
        A quick heads-up so you and your teammates show up ready.
      </P>

      <Section
        style={{
          margin: "4px 0 20px",
          padding: "16px",
          backgroundColor: C.court,
          borderRadius: "10px",
          border: `1px solid ${C.line}`,
        }}
      >
        <Text style={{ margin: "0 0 4px", fontSize: "13px", color: C.muted }}>WHEN</Text>
        <Text style={{ margin: "0 0 12px", fontSize: "15px", color: C.bone }}>{eventDates}</Text>
        <Text style={{ margin: "0 0 4px", fontSize: "13px", color: C.muted }}>WHERE</Text>
        <Text style={{ margin: 0, fontSize: "15px", color: C.bone }}>{venue}</Text>
      </Section>

      <P>
        Each member checks in with their own QR at the desk. Pull them up on
        your team page:
      </P>

      <Button
        href={statusUrl}
        style={{
          backgroundColor: C.orange,
          color: C.court,
          fontSize: "14px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          padding: "12px 22px",
          borderRadius: "8px",
          textDecoration: "none",
        }}
      >
        Open team page →
      </Button>

      <Text style={{ margin: "20px 0 0", fontSize: "13px", color: C.muted }}>
        See you on the court.
      </Text>
    </Layout>
  );
}
