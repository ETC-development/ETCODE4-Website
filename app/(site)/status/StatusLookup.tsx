"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTeamStatus, type TeamStatusResult } from "@/lib/actions";
import { TEAM_CODE_RE } from "@/lib/schema";
import QrImage from "./QrImage";

type Ok = Extract<TeamStatusResult, { ok: true }>;

const STATUS_UI: Record<
  string,
  { title: string; blurb: string; accent: string }
> = {
  pending: {
    title: "Under review",
    blurb: "Your roster is in. We're reviewing applications. Hang tight.",
    accent: "text-chalk",
  },
  accepted: {
    title: "You're in.",
    blurb: "Your team is accepted. Bring each member's QR to check-in.",
    accent: "text-orange",
  },
  waitlisted: {
    title: "Waitlisted",
    blurb:
      "You're on the waitlist. If a spot opens, your leader gets an email. No action needed.",
    accent: "text-blue",
  },
  rejected: {
    title: "Not selected this time",
    blurb:
      "We couldn't offer your team a spot this edition. Thank you for stepping up. We hope to see you next time.",
    accent: "text-bone/60",
  },
};

export default function StatusLookup({ initialCode }: { initialCode: string }) {
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [result, setResult] = useState<TeamStatusResult | null>(null);
  const [pending, startTransition] = useTransition();
  const didAuto = useRef(false);

  function lookup(value: string) {
    startTransition(async () => {
      setResult(await getTeamStatus(value));
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim()) lookup(code.trim());
  }

  // auto-lookup when arriving from an email link (?code=…)
  useEffect(() => {
    if (didAuto.current) return;
    didAuto.current = true;
    if (TEAM_CODE_RE.test(initialCode.trim().toUpperCase()))
      lookup(initialCode.trim().toUpperCase());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ok: Ok | null = result?.ok ? result : null;
  const ui = ok ? STATUS_UI[ok.team.status] ?? STATUS_UI.pending : null;

  return (
    <div className="w-full max-w-xl">
      <p className="font-body text-caption font-semibold uppercase tracking-[0.18em] text-orange">
        ETCODE 4 · Team status
      </p>
      <h1 className="mt-2 font-display text-statement uppercase">
        Check your standing
      </h1>
      <p className="mt-3 text-bone/60">
        Enter your team code to see your status, and once you&apos;re in, each
        member&apos;s check-in QR.
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex gap-2">
        <div className="relative grow">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-bone/40" />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ET4-7KQ2X"
            spellCheck={false}
            autoComplete="off"
            aria-label="Team code"
            aria-busy={pending}
            className="w-full rounded-xl border border-bone/15 bg-surface py-3 pl-10 pr-3 font-mono tracking-wider outline-none placeholder:text-bone/30 focus-visible:border-orange"
          />
        </div>
        <button
          type="submit"
          disabled={pending || !code.trim()}
          aria-busy={pending}
          className="rounded-xl bg-orange px-5 py-3 font-body text-caption font-semibold uppercase tracking-[0.16em] text-court transition-opacity disabled:opacity-50"
        >
          {pending ? "…" : "Check"}
        </button>
      </form>

      {result && !result.ok ? (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {result.error}
        </p>
      ) : null}

      <span aria-live="polite" className="sr-only">
        {ok ? `Team ${ok.team.name}: status ${ok.team.status}.` : ""}
      </span>

      {ok && ui ? (
        <div className="mt-8 rounded-2xl border border-bone/10 bg-surface p-6">
          <p className="font-body text-caption uppercase tracking-wide text-bone/40">
            {ok.team.name} · {ok.team.code}
          </p>
          <h2 className={cn("mt-1 font-display text-title uppercase", ui.accent)}>
            {ui.title}
          </h2>
          <p className="mt-2 text-bone/65">{ui.blurb}</p>

          {/* roster */}
          <ul className="mt-5 divide-y divide-bone/10">
            {ok.members.map((m, i) => (
              <li key={i} className="flex items-center justify-between py-2.5">
                <span className="text-bone">{m.name}</span>
                <span className="text-caption uppercase tracking-wide text-bone/40">
                  {m.role}
                  {m.institution ? ` · ${m.institution}` : ""}
                </span>
              </li>
            ))}
          </ul>

          {/* logistics + QRs when accepted */}
          {ok.logistics ? (
            <div className="mt-6 border-t border-bone/10 pt-6">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-bone/40">When</dt>
                  <dd className="text-bone">{ok.logistics.dates}</dd>
                </div>
                <div>
                  <dt className="text-bone/40">Where</dt>
                  <dd className="text-bone">{ok.logistics.venue}</dd>
                </div>
              </dl>

              <h3 className="mt-6 font-body text-caption font-semibold uppercase tracking-[0.16em] text-bone/50">
                Check-in QR codes
              </h3>
              <p className="mt-1 text-caption text-bone/45">
                Each member scans their own at the desk. Screenshot or show live.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-3">
                {ok.members
                  .filter((m) => m.qr_token)
                  .map((m, i) => (
                    <QrImage key={i} token={m.qr_token!} caption={m.name} />
                  ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
