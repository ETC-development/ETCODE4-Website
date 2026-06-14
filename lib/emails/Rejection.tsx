import { Section, Text } from "@react-email/components";
import { C, Eyebrow, Layout, P, Title } from "./Layout";

export type RejectionProps = {
  teamName: string;
  leaderName: string;
  note?: string | null;
  logoUrl?: string;
  contactEmail: string;
};

export default function Rejection({
  teamName,
  leaderName,
  note,
  logoUrl,
  contactEmail,
}: RejectionProps) {
  return (
    <Layout
      preview={`ETCODE 4: your application status`}
      contactEmail={contactEmail}
      logoUrl={logoUrl}
    >
      <Eyebrow>ETCODE 4</Eyebrow>
      <Title>Thank you for stepping up.</Title>

      <P>Hi {leaderName.split(" ")[0] || "there"},</P>
      <P>
        Thank you for registering for ETCODE 4. This
        edition drew more strong rosters than we have seats for, and we
        weren&apos;t able to offer your team a spot this time.
      </P>
      <P>
        This isn&apos;t the final buzzer. Keep training, keep competing, and we
        hope to see you line up for the next edition.
      </P>

      {note ? (
        <Section
          style={{
            margin: "4px 0 14px",
            padding: "12px 16px",
            borderLeft: `3px solid ${C.line}`,
            backgroundColor: "#202840",
            borderRadius: "8px",
          }}
        >
          <Text
            style={{
              margin: 0,
              fontSize: "14px",
              fontStyle: "italic",
              color: C.chalk,
            }}
          >
            {note}
          </Text>
        </Section>
      ) : null}

      <P>Respect for putting your team on the floor.</P>
    </Layout>
  );
}
