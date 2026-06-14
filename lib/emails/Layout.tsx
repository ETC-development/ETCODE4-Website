import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

// Brand palette (DESIGN.md) inlined — email clients need inline styles and
// can't load ITC Machine, so headings fall back to a bold condensed stack.
export const C = {
  court: "#181d2d",
  surface: "#1e2536",
  orange: "#dd772d",
  chalk: "#cdd4e0",
  bone: "#f6f8ff",
  muted: "#9aa3b8",
  line: "#2c3550",
} as const;

export const DISPLAY_FONT =
  "'Arial Narrow', 'Helvetica Neue', Helvetica, Arial, sans-serif";
export const BODY_FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

export function Layout({
  preview,
  contactEmail,
  logoUrl,
  children,
}: {
  preview: string;
  contactEmail: string;
  logoUrl?: string;
  children: React.ReactNode;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: C.court,
          margin: 0,
          padding: "32px 0",
          fontFamily: BODY_FONT,
        }}
      >
        <Container
          style={{
            maxWidth: "560px",
            margin: "0 auto",
            backgroundColor: C.surface,
            borderRadius: "16px",
            border: `1px solid ${C.line}`,
            overflow: "hidden",
          }}
        >
          {/* orange court stripe */}
          <Section style={{ height: "4px", backgroundColor: C.orange, lineHeight: "4px" }}>
            <Text style={{ margin: 0, fontSize: "1px", lineHeight: "4px" }}>&nbsp;</Text>
          </Section>

          {/* wordmark + logo */}
          <Section style={{ padding: "24px 32px 0" }}>
            {logoUrl ? (
              <Img
                src={logoUrl}
                alt="ETC"
                height="28"
                style={{ height: "28px", width: "auto", marginBottom: "10px" }}
              />
            ) : null}
            <Text
              style={{
                margin: 0,
                fontFamily: DISPLAY_FONT,
                fontSize: "22px",
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: C.bone,
              }}
            >
              ETCODE 4
              <span style={{ color: C.orange }}> · ETC</span>
            </Text>
          </Section>

          <Section style={{ padding: "8px 32px 28px" }}>{children}</Section>

          <Hr style={{ borderColor: C.line, margin: 0 }} />

          <Section style={{ padding: "20px 32px 28px" }}>
            <Text
              style={{
                margin: "0 0 8px",
                fontFamily: DISPLAY_FONT,
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: C.orange,
              }}
            >
              Three coders. One court. No timeouts.
            </Text>
            <Text style={{ margin: 0, fontSize: "12px", color: C.muted }}>
              ENSIA Tech Community · ENSIA School, Sidi Abdellah, Algiers
            </Text>
            <Text style={{ margin: "6px 0 0", fontSize: "12px", color: C.muted }}>
              Questions? Reply to this email or reach us at{" "}
              <Link
                href={`mailto:${contactEmail}`}
                style={{ color: C.chalk }}
              >
                {contactEmail}
              </Link>
              .
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Small shared building blocks ------------------------------------------------

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        margin: "0 0 8px",
        fontSize: "12px",
        fontWeight: 700,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: C.orange,
      }}
    >
      {children}
    </Text>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        margin: "0 0 16px",
        fontFamily: DISPLAY_FONT,
        fontSize: "34px",
        lineHeight: 1.05,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "-0.01em",
        color: C.bone,
      }}
    >
      {children}
    </Text>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        margin: "0 0 14px",
        fontSize: "15px",
        lineHeight: 1.6,
        color: C.bone,
      }}
    >
      {children}
    </Text>
  );
}
