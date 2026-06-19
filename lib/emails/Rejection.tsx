import { Eyebrow, Layout, P, Title } from "./Layout";

export type RejectionProps = {
  teamName: string;
  leaderName: string;
  logoUrl?: string;
  contactEmail: string;
};

export default function Rejection({
  leaderName,
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

      <P>Respect for putting your team on the floor.</P>
    </Layout>
  );
}
