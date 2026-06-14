import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

// Gmail Workspace SMTP over STARTTLS (port 587). React Email renders the HTML;
// Nodemailer is the only send path — no third-party send service.

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS,
  );
}

let cached: Transporter | null = null;

function transport(): Transporter {
  if (!isEmailConfigured()) throw new Error("EMAIL_NOT_CONFIGURED");
  if (!cached) {
    cached = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT ?? 587), // 587
      secure: false, // STARTTLS on 587
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER!,
        pass: process.env.EMAIL_PASS!,
      },
    });
  }
  return cached;
}

// Gmail forces the address to EMAIL_USER; EMAIL_FROM is the display name.
export function fromHeader(): string {
  return `"${process.env.EMAIL_FROM ?? "ETCODE 4"}" <${process.env.EMAIL_USER}>`;
}

export type MailAttachment = {
  filename: string;
  content: Buffer;
  cid?: string; // referenced inline as <img src="cid:...">
  contentType?: string;
};

export async function sendMail(opts: {
  to: string;
  cc?: string[];
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: MailAttachment[];
}): Promise<string> {
  const info = await transport().sendMail({
    from: fromHeader(),
    to: opts.to,
    cc: opts.cc?.length ? opts.cc : undefined,
    subject: opts.subject,
    html: opts.html,
    replyTo: opts.replyTo,
    attachments: opts.attachments?.length ? opts.attachments : undefined,
  });
  return info.messageId;
}
