import "server-only";
import { render } from "@react-email/render";
import QRCode from "qrcode";
import { EVENT } from "@/lib/content";
import type { MailAttachment } from "@/lib/email";
import Acceptance from "./Acceptance";
import Rejection from "./Rejection";
import Reminder from "./Reminder";
import CheckinQr from "./CheckinQr";

export type EmailTemplate =
  | "acceptance"
  | "rejection"
  | "reminder"
  | "checkin_qr";

export type TeamEmailData = {
  teamName: string;
  code: string;
  leaderName: string;
  note?: string | null;
  // needed for acceptance + checkin_qr (per-player QR)
  members?: { name: string; qrToken: string | null }[];
};

// Preview renders QR as inline data URIs (visible in the admin iframe). Send
// renders them as cid: references backed by real attachments — Gmail and most
// clients strip base64 data-URI <img>, so CID is the only reliable inline path.
export type RenderMode = "preview" | "send";

export type RenderOptions = {
  mode?: RenderMode;
  subject?: string; // override the default subject
  note?: string | null; // override the personal message (undefined = use data.note)
};

export type RenderedEmail = {
  subject: string;
  html: string;
  attachments: MailAttachment[];
};

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://etcode4.vercel.app"
  );
}

// "21–22 June 2026" in the event's timezone (deterministic).
function eventDates(): string {
  const tz = "Africa/Algiers";
  const d = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: tz }).format(
      new Date(iso),
    );
  const startDay = d(EVENT.startISO, { day: "numeric" });
  const endDay = d(EVENT.endISO, { day: "numeric" });
  const monthYear = d(EVENT.endISO, { month: "long", year: "numeric" });
  return startDay === endDay
    ? `${startDay} ${monthYear}`
    : `${startDay}–${endDay} ${monthYear}`;
}

function statusUrl(code: string): string {
  return `${siteUrl()}/status?code=${encodeURIComponent(code)}`;
}

function logoUrl(): string {
  // PNG (not SVG) so email clients render it; absolute so it resolves remotely.
  return `${siteUrl()}/brand/etc-white.png`;
}

async function qrBuffer(token: string): Promise<Buffer> {
  return QRCode.toBuffer(token, {
    margin: 1,
    width: 320,
    errorCorrectionLevel: "M",
    color: { dark: "#181d2dff", light: "#f6f8ffff" },
  });
}

export type QrMember = { name: string; qrSrc: string };

/**
 * Build the per-player QR list + any attachments for the chosen mode. Only
 * members with a (non-null) qr_token get a code.
 */
async function buildQr(
  members: { name: string; qrToken: string | null }[],
  mode: RenderMode,
): Promise<{ list: QrMember[]; attachments: MailAttachment[] }> {
  const withTokens = members.filter((m) => m.qrToken);
  const list: QrMember[] = [];
  const attachments: MailAttachment[] = [];

  for (let i = 0; i < withTokens.length; i++) {
    const m = withTokens[i];
    const buf = await qrBuffer(m.qrToken as string);
    if (mode === "send") {
      const cid = `qr-${i}@etcode4`;
      attachments.push({
        filename: `qr-${i + 1}.png`,
        content: buf,
        cid,
        contentType: "image/png",
      });
      list.push({ name: m.name, qrSrc: `cid:${cid}` });
    } else {
      list.push({
        name: m.name,
        qrSrc: `data:image/png;base64,${buf.toString("base64")}`,
      });
    }
  }
  return { list, attachments };
}

const DEFAULT_SUBJECT: Record<EmailTemplate, string> = {
  acceptance: `${EVENT.name}: You are in !`,
  rejection: `${EVENT.name} your application`,
  reminder: `${EVENT.name} is almost here`,
  checkin_qr: `Your ${EVENT.name} check-in QR codes`,
};

/** The personal-message default for a template (so the composer can seed it). */
export function defaultNote(
  template: EmailTemplate,
  note?: string | null,
): string {
  return template === "reminder" || template === "checkin_qr"
    ? ""
    : (note ?? "");
}

export function defaultSubject(template: EmailTemplate): string {
  return DEFAULT_SUBJECT[template];
}

export async function renderEmail(
  template: EmailTemplate,
  data: TeamEmailData,
  opts: RenderOptions = {},
): Promise<RenderedEmail> {
  const mode = opts.mode ?? "send";
  const subject = opts.subject?.trim() || DEFAULT_SUBJECT[template];
  const note = opts.note !== undefined ? opts.note : data.note;

  let html: string;
  let attachments: MailAttachment[] = [];

  if (template === "acceptance") {
    const { list, attachments: qrAttachments } = await buildQr(
      data.members ?? [],
      mode,
    );
    attachments = qrAttachments;
    html = await render(
      <Acceptance
        teamName={data.teamName}
        code={data.code}
        leaderName={data.leaderName}
        note={note}
        members={list}
        eventDates={eventDates()}
        venue={EVENT.venue}
        statusUrl={statusUrl(data.code)}
        logoUrl={logoUrl()}
        contactEmail={EVENT.contactEmail}
      />,
    );
  } else if (template === "rejection") {
    html = await render(
      <Rejection
        teamName={data.teamName}
        leaderName={data.leaderName}
        note={note}
        logoUrl={logoUrl()}
        contactEmail={EVENT.contactEmail}
      />,
    );
  } else if (template === "reminder") {
    html = await render(
      <Reminder
        teamName={data.teamName}
        leaderName={data.leaderName}
        eventDates={eventDates()}
        venue={EVENT.venue}
        statusUrl={statusUrl(data.code)}
        logoUrl={logoUrl()}
        contactEmail={EVENT.contactEmail}
      />,
    );
  } else {
    const { list, attachments: qrAttachments } = await buildQr(
      data.members ?? [],
      mode,
    );
    attachments = qrAttachments;
    html = await render(
      <CheckinQr
        teamName={data.teamName}
        leaderName={data.leaderName}
        members={list}
        eventDates={eventDates()}
        venue={EVENT.venue}
        logoUrl={logoUrl()}
        contactEmail={EVENT.contactEmail}
      />,
    );
  }

  return { subject, html, attachments };
}
