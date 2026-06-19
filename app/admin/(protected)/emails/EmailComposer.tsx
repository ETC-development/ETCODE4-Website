"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/admin/Toast";
import { previewEmail, sendTeamEmail, type PreviewResult } from "./actions";

type Template = "acceptance" | "rejection" | "reminder" | "checkin_qr";

const TEMPLATES: Template[] = [
  "acceptance",
  "rejection",
  "reminder",
  "checkin_qr",
];

const LABEL: Record<Template, string> = {
  acceptance: "Acceptance",
  rejection: "Rejection",
  reminder: "Reminder",
  checkin_qr: "Check-in QR",
};

// Only these templates render the editable personal message.
const HAS_NOTE: Record<Template, boolean> = {
  acceptance: true,
  rejection: false,
  reminder: false,
  checkin_qr: false,
};

type Preview = Extract<PreviewResult, { ok: true }>;

export default function EmailComposer({ code }: { code: string }) {
  const router = useRouter();
  const toast = useToast();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(false);
  const [rerendering, setRerendering] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [confirmingResend, setConfirmingResend] = useState(false);

  // editable fields
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqId = useRef(0); // guards against out-of-order preview responses

  const overrides = useCallback(
    (t: Template, subj: string, msg: string) => ({
      subject: subj,
      note: HAS_NOTE[t] ? msg : undefined,
    }),
    [],
  );

  // Modal a11y: focus the dialog on open, trap Tab, close on Escape, and
  // restore focus to the opener on close.
  useEffect(() => {
    if (!template) return;
    const dialog = dialogRef.current;
    dialog?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key === "Tab" && dialog) {
        const f = dialog.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input,textarea,[tabindex]:not([tabindex="-1"])',
        );
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      openerRef.current?.focus();
    };
  }, [template]);

  async function openPreview(t: Template) {
    openerRef.current = document.activeElement as HTMLElement;
    setTemplate(t);
    setLoading(true);
    setError(null);
    setPreview(null);
    setConfirmingResend(false);
    const res = await previewEmail(code, t);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSubject(res.defaultSubject);
    setMessage(res.defaultNote);
    setPreview(res);
  }

  // re-render the preview server-side with the current edits (debounced)
  function scheduleRerender(nextSubject: string, nextMessage: string) {
    if (!template) return;
    setConfirmingResend(false); // edits invalidate a pending resend confirm
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      const id = ++reqId.current;
      setRerendering(true);
      const res = await previewEmail(
        code,
        template,
        overrides(template, nextSubject, nextMessage),
      );
      if (id !== reqId.current) return; // a newer edit superseded this one
      setRerendering(false);
      if (res.ok) setPreview(res);
    }, 500);
  }

  function onSubjectChange(v: string) {
    setSubject(v);
    scheduleRerender(v, message);
  }
  function onMessageChange(v: string) {
    setMessage(v);
    scheduleRerender(subject, v);
  }

  function close() {
    setTemplate(null);
    setPreview(null);
    setError(null);
    setConfirmingResend(false);
    if (debounce.current) clearTimeout(debounce.current);
  }

  async function send() {
    if (!template || !preview) return;
    // Resend must be a deliberate two-step action, never an automatic force.
    if (preview.alreadySentAt && !confirmingResend) {
      setConfirmingResend(true);
      return;
    }
    setSending(true);
    setError(null);
    const res = await sendTeamEmail(
      code,
      template,
      Boolean(preview.alreadySentAt),
      overrides(template, subject, message),
    );
    setSending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    close();
    toast.success(
      res.status === "skipped" ? "Already sent, skipped." : "Email sent.",
    );
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-orange/20 bg-surface p-4">
      <h2 className="font-body text-caption font-semibold uppercase tracking-[0.16em] text-orange">
        Send decision email
      </h2>
      <p className="text-caption text-bone/55">
        Super-admin only · preview &amp; edit before sending.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => openPreview(t)}
            className="rounded-lg border border-bone/20 px-3 py-2 text-caption font-semibold uppercase tracking-wide text-bone/80 transition-colors hover:border-orange/40 hover:text-bone"
          >
            {LABEL[t]}
          </button>
        ))}
      </div>
      {error && !template ? (
        <p role="alert" className="mt-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {/* preview + edit modal */}
      {template ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-court/80 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${LABEL[template]} email`}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-bone/15 bg-surface-2 outline-none"
          >
            <div className="flex items-center justify-between border-b border-bone/10 px-5 py-3">
              <h3 className="font-display text-lg uppercase">
                {LABEL[template]} email
              </h3>
              <button
                type="button"
                onClick={close}
                className="text-bone/50 hover:text-bone"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4">
              {loading ? (
                <p className="py-10 text-center text-bone/50">Rendering…</p>
              ) : preview ? (
                <>
                  {/* editable subject */}
                  <label className="block">
                    <span className="text-caption text-bone/45">Subject</span>
                    <input
                      value={subject}
                      onChange={(e) => onSubjectChange(e.target.value)}
                      maxLength={150}
                      className="mt-1 w-full rounded-lg border border-bone/15 bg-court px-3 py-2 text-sm text-bone outline-none focus-visible:border-orange"
                    />
                  </label>

                  {/* editable personal message */}
                  {HAS_NOTE[template] ? (
                    <label className="mt-3 block">
                      <span className="text-caption text-bone/45">
                        Personal message (shown in the email)
                      </span>
                      <textarea
                        value={message}
                        onChange={(e) => onMessageChange(e.target.value)}
                        rows={3}
                        maxLength={1000}
                        placeholder="Optional. A line just for this team."
                        className="mt-1 w-full resize-y rounded-lg border border-bone/15 bg-court px-3 py-2 text-sm text-bone outline-none placeholder:text-bone/30 focus-visible:border-orange"
                      />
                    </label>
                  ) : null}

                  <dl className="mb-3 mt-3 space-y-1 text-sm">
                    <div>
                      <span className="text-bone/55">To: </span>
                      <span className="text-bone">{preview.to}</span>
                    </div>
                    {preview.cc.length ? (
                      <div>
                        <span className="text-bone/55">Cc: </span>
                        <span className="text-bone/80">{preview.cc.join(", ")}</span>
                      </div>
                    ) : null}
                  </dl>

                  {preview.alreadySentAt ? (
                    <p className="mb-3 rounded-lg bg-orange/10 px-3 py-2 text-caption text-orange">
                      A {template} email was already sent to this team. Sending
                      again will resend.
                    </p>
                  ) : null}
                  {((template === "acceptance" && preview.status !== "accepted") ||
                    (template === "rejection" && preview.status !== "rejected")) ? (
                    <p className="mb-3 rounded-lg bg-blue/15 px-3 py-2 text-caption text-chalk">
                      Heads up: this team&apos;s status is{" "}
                      <strong>{preview.status}</strong>, which doesn&apos;t match a{" "}
                      {template} email.
                    </p>
                  ) : null}

                  <div className="relative">
                    {rerendering ? (
                      <span className="absolute right-2 top-2 z-10 rounded-md bg-court/90 px-2 py-0.5 text-caption text-bone/60">
                        Updating…
                      </span>
                    ) : null}
                    <iframe
                      title="Email preview"
                      srcDoc={preview.html}
                      sandbox=""
                      className="h-[420px] w-full rounded-lg border border-bone/10 bg-white"
                    />
                  </div>
                </>
              ) : error ? (
                <p role="alert" className="py-6 text-center text-sm text-danger">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-bone/10 px-5 py-3">
              {error && preview ? (
                <span className="mr-auto text-sm text-danger">{error}</span>
              ) : null}
              <button
                type="button"
                onClick={close}
                className="rounded-lg px-4 py-2 text-sm text-bone/60 hover:text-bone"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={send}
                disabled={!preview || sending || rerendering}
                className={cn(
                  "rounded-lg px-5 py-2 text-caption font-semibold uppercase tracking-wide transition-opacity disabled:opacity-50",
                  "bg-orange text-court",
                )}
              >
                {sending
                  ? "Sending…"
                  : confirmingResend
                    ? "Confirm resend?"
                    : preview?.alreadySentAt
                      ? "Resend"
                      : "Send"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
