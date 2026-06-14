import { Column, Img, Row, Section, Text } from "@react-email/components";
import { C, Eyebrow, Layout, P, Title } from "./Layout";

export type QrMember = { name: string; qrSrc: string };

export type CheckinQrProps = {
  teamName: string;
  leaderName: string;
  members: QrMember[];
  eventDates: string;
  venue: string;
  logoUrl?: string;
  contactEmail: string;
};

export default function CheckinQr({
  teamName,
  leaderName,
  members,
  eventDates,
  venue,
  logoUrl,
  contactEmail,
}: CheckinQrProps) {
  // two QR cards per row
  const rows: QrMember[][] = [];
  for (let i = 0; i < members.length; i += 2) rows.push(members.slice(i, i + 2));

  return (
    <Layout
      preview={`Your check-in QR codes for ${teamName}`}
      contactEmail={contactEmail}
      logoUrl={logoUrl}
    >
      <Eyebrow>Check-in</Eyebrow>
      <Title>Your QR codes.</Title>

      <P>Hi {leaderName.split(" ")[0] || "there"},</P>
      <P>
        Each member of <strong style={{ color: C.bone }}>{teamName}</strong> scans
        their own QR at the desk. Screenshot these or keep this email handy.
      </P>

      {rows.map((pair, ri) => (
        <Row key={ri}>
          {pair.map((m) => (
            <Column key={m.name} align="center" style={{ padding: "8px" }}>
              <div
                style={{
                  backgroundColor: C.bone,
                  borderRadius: "12px",
                  padding: "8px",
                  display: "inline-block",
                }}
              >
                <Img src={m.qrSrc} alt={`QR for ${m.name}`} width="150" height="150" />
              </div>
              <Text
                style={{
                  margin: "6px 0 0",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: C.chalk,
                }}
              >
                {m.name}
              </Text>
            </Column>
          ))}
        </Row>
      ))}

      <Section
        style={{
          margin: "20px 0 0",
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
    </Layout>
  );
}
