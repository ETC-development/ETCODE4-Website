import { Button, Column, Img, Row, Section, Text } from "@react-email/components";
import { C, Eyebrow, Layout, P, Title } from "./Layout";

export type AcceptanceProps = {
  teamName: string;
  code: string;
  leaderName: string;
  note?: string | null;
  members: { name: string; qrSrc: string }[];
  eventDates: string;
  venue: string;
  statusUrl: string;
  logoUrl?: string;
  contactEmail: string;
};

export default function Acceptance({
  teamName,
  code,
  leaderName,
  note,
  members,
  eventDates,
  venue,
  statusUrl,
  logoUrl,
  contactEmail,
}: AcceptanceProps) {
  // two QR cards per row
  const rows: { name: string; qrSrc: string }[][] = [];
  for (let i = 0; i < members.length; i += 2) rows.push(members.slice(i, i + 2));

  return (
    <Layout
      preview={`${teamName} is in ETCODE 4`}
      contactEmail={contactEmail}
      logoUrl={logoUrl}
    >
      <Eyebrow>You&apos;re on the court</Eyebrow>
      <Title>You&apos;re in.</Title>

      <P>Hi {leaderName.split(" ")[0] || "there"},</P>
      <P>
        Team <strong style={{ color: C.bone }}>{teamName}</strong> ({code}) is
        <strong style={{ color: C.orange }}> accepted</strong> to ETCODE 4. Three
        coders, one court. Time to lock your plays and show up ready to ball.
      </P>

      {note ? (
        <Section
          style={{
            margin: "0 0 16px",
            padding: "12px 16px",
            borderLeft: `3px solid ${C.orange}`,
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

      <Section
        style={{
          margin: "4px 0 24px",
          padding: "16px",
          backgroundColor: C.court,
          borderRadius: "10px",
          border: `1px solid ${C.line}`,
        }}
      >
        <Text style={{ margin: "0 0 4px", fontSize: "13px", color: C.muted }}>
          TIP-OFF
        </Text>
        <Text style={{ margin: "0 0 12px", fontSize: "15px", color: C.bone }}>
          {eventDates}
        </Text>
        <Text style={{ margin: "0 0 4px", fontSize: "13px", color: C.muted }}>
          THE COURT
        </Text>
        <Text style={{ margin: 0, fontSize: "15px", color: C.bone }}>
          {venue}
        </Text>
      </Section>

      {/* per-player check-in QR codes */}
      {members.length ? (
        <>
          <Eyebrow>Your check-in passes</Eyebrow>
          <P>
            Each player scans their <strong style={{ color: C.bone }}>own</strong>{" "}
            QR at the check-in desk, your team checks in the moment all three
            are scanned. Save this email or screenshot your codes.
          </P>

          {rows.map((pair, ri) => (
            <Row key={ri}>
              {pair.map((m) => (
                <Column key={m.name} align="center" style={{ padding: "8px" }}>
                  <table
                    role="presentation"
                    cellPadding={0}
                    cellSpacing={0}
                    style={{ margin: "0 auto" }}
                  >
                    <tbody>
                      <tr>
                        <td
                          style={{
                            backgroundColor: C.bone,
                            borderRadius: "12px",
                            padding: "10px",
                          }}
                        >
                          <Img
                            src={m.qrSrc}
                            alt={`Check-in QR for ${m.name}`}
                            width="150"
                            height="150"
                            style={{ display: "block" }}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <Text
                    style={{
                      margin: "8px 0 0",
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
        </>
      ) : null}

      <Section style={{ margin: "8px 0 4px" }}>
        <P>Track your status and re-open your QR codes any time:</P>
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
      </Section>

      <Text style={{ margin: "20px 0 0", fontSize: "13px", color: C.muted }}>
        Use code <strong style={{ color: C.chalk }}>{code}</strong> if asked.
        See you on the court.
      </Text>
    </Layout>
  );
}
