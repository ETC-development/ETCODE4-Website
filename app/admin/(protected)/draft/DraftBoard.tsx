"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { cn, safeExternalUrl } from "@/lib/utils";
import { useToast } from "@/components/admin/Toast";
import { EmptyState } from "@/components/admin/ui";
import { fmtDate, fmtDateTime } from "@/lib/admin/format";
import type { PartialTeam, SoloRow } from "@/lib/admin/draft";
import { addSoloToTeam, formTeamFromSolos, rejectSolo } from "./actions";

const HANDLES: { key: keyof SoloRow; label: string }[] = [
  { key: "leetcode", label: "LeetCode" },
  { key: "hackerrank", label: "HackerRank" },
  { key: "github", label: "GitHub" },
];

export default function DraftBoard({
  solos,
  partialTeams,
  canReject,
}: {
  solos: SoloRow[];
  partialTeams: PartialTeam[];
  canReject: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<SoloRow | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev; // cap at 3
      return [...prev, id];
    });
  }

  function form() {
    if (selected.length !== 3 || name.trim().length < 2) return;
    setError(null);
    startTransition(async () => {
      const res = await formTeamFromSolos(selected, name.trim());
      if (!res.ok) return setError(res.error);
      toast.success(`Formed ${res.code}. Now in the review queue.`);
      setSelected([]);
      setName("");
      router.refresh();
    });
  }

  const order = (id: string) => selected.indexOf(id);

  return (
    <section className={cn(selected.length > 0 && "pb-24")}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-4xl uppercase">Draft board</h1>
        <p className="text-caption text-bone/60">{solos.length} free agents</p>
      </div>
      <p className="mt-1 text-sm text-bone/55">
        Click a card to see an applicant&apos;s full profile, add them to a team
        with an open slot, or reject them. Or tick three to form a brand-new
        team — the first pick becomes the leader.
      </p>

      {solos.length === 0 ? (
        <EmptyState className="mt-6">No solo free-agents right now.</EmptyState>
      ) : (
        <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {solos.map((s) => {
            const idx = order(s.id);
            const isSel = idx >= 0;
            return (
              <li key={s.id} className="relative">
                <button
                  type="button"
                  onClick={() => setDetail(s)}
                  className={cn(
                    "w-full rounded-xl border p-4 pr-12 text-left transition-colors",
                    isSel
                      ? "border-orange bg-orange/10"
                      : "border-bone/10 bg-surface hover:border-bone/25",
                  )}
                >
                  <span className="block font-medium text-bone">
                    {s.full_name}
                  </span>
                  <span className="mt-1 block text-caption text-bone/50">
                    {s.institution ?? "n/a"} · {s.study_year ?? "n/a"}
                  </span>
                  {s.motivation ? (
                    <span className="mt-2 line-clamp-2 block text-caption italic text-bone/45">
                      {s.motivation}
                    </span>
                  ) : null}
                  <span className="mt-2 block text-caption text-bone/45">
                    joined {fmtDate(s.created_at)}
                  </span>
                </button>

                {/* selection toggle for forming a new team of three */}
                <button
                  type="button"
                  onClick={() => toggle(s.id)}
                  aria-pressed={isSel}
                  aria-label={`Select ${s.full_name} for a new team`}
                  className={cn(
                    "absolute right-3 top-3 z-10 grid size-6 place-items-center rounded-full border text-caption font-bold transition-colors",
                    isSel
                      ? "border-orange bg-orange text-court"
                      : "border-bone/25 text-transparent hover:border-bone/50",
                  )}
                >
                  {isSel ? (idx === 0 ? "L" : idx + 1) : "+"}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* form-team bar */}
      {selected.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-bone/15 bg-surface-2/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
            <span className="text-sm text-bone/80">{selected.length}/3 picked</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Team name"
              aria-label="New team name"
              className="grow rounded-lg border border-bone/15 bg-court px-3 py-2 text-sm outline-none placeholder:text-bone/45 focus-visible:border-orange sm:max-w-xs"
            />
            {error ? (
              <span role="alert" className="text-caption text-danger">{error}</span>
            ) : null}
            <button
              type="button"
              onClick={() => setSelected([])}
              className="text-sm text-bone/50 hover:text-bone"
            >
              Clear
            </button>
            <button
              type="button"
              disabled={pending || selected.length !== 3 || name.trim().length < 2}
              onClick={form}
              className="ml-auto rounded-lg bg-orange px-5 py-2 text-caption font-semibold uppercase tracking-wide text-court disabled:opacity-40"
            >
              {pending ? "Forming…" : "Form team"}
            </button>
          </div>
        </div>
      ) : null}

      {detail ? (
        <SoloDetail
          solo={detail}
          partialTeams={partialTeams}
          canReject={canReject}
          onClose={() => setDetail(null)}
          onDone={(id) => {
            setSelected((prev) => prev.filter((x) => x !== id));
            setDetail(null);
            router.refresh();
          }}
        />
      ) : null}
    </section>
  );
}

function SoloDetail({
  solo,
  partialTeams,
  canReject,
  onClose,
  onDone,
}: {
  solo: SoloRow;
  partialTeams: PartialTeam[];
  canReject: boolean;
  onClose: () => void;
  onDone: (id: string) => void;
}) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [teamId, setTeamId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmingReject, setConfirmingReject] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function addToTeam() {
    if (!teamId) return;
    setError(null);
    startTransition(async () => {
      const res = await addSoloToTeam(solo.id, teamId);
      if (!res.ok) return setError(res.error);
      toast.success(`Added ${solo.full_name.split(" ")[0]} to ${res.code}.`);
      onDone(solo.id);
    });
  }

  function reject() {
    if (!confirmingReject) {
      setConfirmingReject(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await rejectSolo(solo.id);
      if (!res.ok) {
        setConfirmingReject(false);
        return setError(res.error);
      }
      toast.success(`Rejected ${solo.full_name.split(" ")[0]} (email sent).`);
      onDone(solo.id);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-court/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${solo.full_name} — applicant profile`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-bone/15 bg-surface-2 outline-none"
      >
        <div className="flex items-start justify-between gap-3 border-b border-bone/10 px-5 py-3">
          <div>
            <h3 className="font-display text-lg uppercase">{solo.full_name}</h3>
            <p className="text-caption text-bone/45">
              Solo free-agent · joined {fmtDateTime(solo.created_at)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-bone/50 hover:text-bone"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-bone/70">
            <div className="col-span-2">
              <dt className="inline text-bone/55">Email: </dt>
              <dd className="inline">{solo.email}</dd>
            </div>
            <div className="col-span-2">
              <dt className="inline text-bone/55">Phone: </dt>
              <dd className="inline">{solo.phone ?? "n/a"}</dd>
            </div>
            <div>
              <dt className="inline text-bone/55">Institution: </dt>
              <dd className="inline">{solo.institution ?? "n/a"}</dd>
            </div>
            <div>
              <dt className="inline text-bone/55">Year: </dt>
              <dd className="inline">{solo.study_year ?? "n/a"}</dd>
            </div>
            {solo.tshirt_size ? (
              <div>
                <dt className="inline text-bone/55">T-shirt: </dt>
                <dd className="inline">{solo.tshirt_size}</dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-3 flex flex-wrap gap-3 text-caption">
            {HANDLES.map(({ key, label }) => {
              const url = safeExternalUrl(solo[key] as string | null);
              return url ? (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-skyblue hover:text-orange"
                >
                  {label} ↗
                </a>
              ) : null;
            })}
          </div>

          <div className="mt-4">
            <p className="text-caption font-semibold uppercase tracking-[0.16em] text-bone/50">
              Motivation
            </p>
            {solo.motivation ? (
              <p className="mt-2 whitespace-pre-line border-l-2 border-bone/15 pl-3 text-sm italic text-bone/70">
                {solo.motivation}
              </p>
            ) : (
              <p className="mt-2 text-sm text-bone/40">No motivation provided.</p>
            )}
          </div>

          {/* add to an existing partial team */}
          <div className="mt-5 rounded-xl border border-bone/10 bg-surface p-4">
            <p className="text-caption font-semibold uppercase tracking-[0.16em] text-bone/55">
              Add to a team
            </p>
            {partialTeams.length === 0 ? (
              <p className="mt-2 text-caption text-bone/45">
                No teams with an open slot right now.
              </p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                <select
                  value={teamId}
                  disabled={pending}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="grow rounded-lg border border-bone/15 bg-court px-3 py-2 text-sm outline-none focus-visible:border-orange disabled:opacity-50"
                >
                  <option value="">Choose a team…</option>
                  {partialTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.memberCount}/3) · {t.code}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addToTeam}
                  disabled={pending || !teamId}
                  className="rounded-lg bg-orange px-4 py-2 text-caption font-semibold uppercase tracking-wide text-court disabled:opacity-40"
                >
                  {pending ? "Adding…" : "Add"}
                </button>
              </div>
            )}
          </div>

          {error ? (
            <p
              role="alert"
              className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger"
            >
              {error}
            </p>
          ) : null}
        </div>

        {canReject ? (
          <div className="flex items-center justify-between gap-3 border-t border-bone/10 px-5 py-3">
            <span className="text-caption text-bone/45">
              Rejecting emails the applicant and removes them from the pool.
            </span>
            <button
              type="button"
              onClick={reject}
              disabled={pending}
              className={cn(
                "rounded-lg border px-4 py-2 text-caption font-semibold uppercase tracking-wide transition-colors disabled:opacity-50",
                confirmingReject
                  ? "border-danger bg-danger/15 text-danger"
                  : "border-bone/20 text-bone/80 hover:border-danger/50 hover:text-danger",
              )}
            >
              {pending
                ? "Rejecting…"
                : confirmingReject
                  ? "Confirm reject?"
                  : "Reject"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
