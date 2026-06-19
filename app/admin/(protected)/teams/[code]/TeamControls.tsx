"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/admin/Toast";
import { DECISIONS, type Decision, type TeamStatus } from "@/lib/admin/types";
import { decideTeam, toggleFlag, saveInternalNote, assignTeamName } from "../actions";

const DECISION_LABEL: Record<Decision, string> = {
  accepted: "Accept",
  waitlisted: "Waitlist",
  rejected: "Reject",
};

export default function TeamControls({
  code,
  status,
  flagged,
  decisionNote,
  internalNote,
  assignedName,
  nameOptions,
}: {
  code: string;
  status: TeamStatus;
  flagged: boolean;
  decisionNote: string;
  internalNote: string;
  assignedName: string;
  nameOptions: { name: string; taken: boolean }[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState(decisionNote);
  const [internal, setInternal] = useState(internalNote);
  const [error, setError] = useState<string | null>(null);

  function assignName(name: string) {
    setError(null);
    startTransition(async () => {
      const res = await assignTeamName(code, name);
      if (!res.ok) return setError(res.error);
      router.refresh();
      toast.success(name ? `Assigned “${name}”` : "Name cleared");
    });
  }

  function decide(decision: Decision) {
    setError(null);
    startTransition(async () => {
      const res = await decideTeam(code, decision, note.trim() || undefined);
      if (!res.ok) return setError(res.error);
      router.refresh();
      toast.success(`Marked ${decision}`);
    });
  }

  function flagToggle() {
    setError(null);
    startTransition(async () => {
      const res = await toggleFlag(code, !flagged);
      if (!res.ok) return setError(res.error);
      router.refresh();
    });
  }

  function saveNote() {
    setError(null);
    startTransition(async () => {
      const res = await saveInternalNote(code, internal);
      if (!res.ok) return setError(res.error);
      router.refresh();
      toast.success("Note saved");
    });
  }

  return (
    <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
      {/* official name */}
      <div className="rounded-xl border border-bone/10 bg-surface p-4">
        <h2 className="font-body text-caption font-semibold uppercase tracking-[0.16em] text-bone/55">
          Official name
        </h2>
        <p className="text-caption text-bone/50">
          Used in the acceptance email, status page &amp; live board.
        </p>
        {nameOptions.length === 0 ? (
          <p className="mt-2 rounded-lg border border-dashed border-bone/10 px-3 py-2 text-caption text-bone/40">
            No names configured yet (add them in lib/team-names.ts).
          </p>
        ) : (
          <select
            value={assignedName}
            disabled={pending}
            onChange={(e) => assignName(e.target.value)}
            className="mt-2 w-full rounded-lg border border-bone/15 bg-court px-3 py-2 text-sm outline-none focus-visible:border-orange disabled:opacity-50"
          >
            <option value="">unassigned</option>
            {nameOptions.map((o) => (
              <option key={o.name} value={o.name} disabled={o.taken && o.name !== assignedName}>
                {o.name}
                {o.taken && o.name !== assignedName ? " (taken)" : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* decision */}
      <div className="rounded-xl border border-bone/10 bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-body text-caption font-semibold uppercase tracking-[0.16em] text-bone/55">
            Decision
          </h2>
          <button
            type="button"
            onClick={flagToggle}
            disabled={pending}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-caption transition-colors disabled:opacity-50",
              flagged
                ? "border-orange/40 bg-orange/10 text-orange"
                : "border-bone/15 text-bone/50 hover:text-bone",
            )}
          >
            <Flag className="size-3" /> {flagged ? "Flagged" : "Flag"}
          </button>
        </div>

        <label className="mt-3 block">
          <span className="text-caption text-bone/45">
            Personal note (added to the acceptance email only)
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={600}
            placeholder="Optional. A line just for this team."
            className="mt-1 w-full resize-y rounded-lg border border-bone/15 bg-court px-3 py-2 text-sm outline-none placeholder:text-bone/30 focus-visible:border-orange"
          />
        </label>

        <div className="mt-3 grid gap-2">
          {DECISIONS.map((d) => {
            const active = status === d;
            return (
              <button
                key={d}
                type="button"
                disabled={pending}
                onClick={() => decide(d)}
                className={cn(
                  "rounded-lg px-4 py-2.5 text-caption font-semibold uppercase tracking-wide transition-all disabled:opacity-50",
                  active
                    ? "ring-1 ring-inset"
                    : "opacity-90 hover:opacity-100",
                  d === "accepted"
                    ? "bg-orange text-court"
                    : d === "waitlisted"
                      ? "bg-blue text-bone"
                      : "border border-bone/20 text-bone/80 hover:bg-bone/5",
                )}
              >
                {DECISION_LABEL[d]}
                {active ? " ✓" : ""}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-caption text-bone/50">
          Decisions don&apos;t send email. That&apos;s a separate super-admin step.
        </p>
      </div>

      {/* internal note */}
      <div className="rounded-xl border border-bone/10 bg-surface p-4">
        <h2 className="font-body text-caption font-semibold uppercase tracking-[0.16em] text-bone/55">
          Internal note
        </h2>
        <p className="text-caption text-bone/50">Private. Never emailed.</p>
        <textarea
          value={internal}
          onChange={(e) => setInternal(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Shared notes for the review team…"
          className="mt-2 w-full resize-y rounded-lg border border-bone/15 bg-court px-3 py-2 text-sm outline-none placeholder:text-bone/30 focus-visible:border-orange"
        />
        <button
          type="button"
          onClick={saveNote}
          disabled={pending || internal === internalNote}
          className="mt-2 w-full rounded-lg border border-bone/20 px-4 py-2 text-caption font-semibold uppercase tracking-wide text-bone/80 transition-colors hover:bg-bone/5 disabled:opacity-40"
        >
          Save note
        </button>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </aside>
  );
}
