"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Flag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminButton } from "@/components/admin/ui";
import StatusChip from "@/components/admin/StatusChip";
import { fmtDateTime } from "@/lib/admin/format";
import {
  DECISIONS,
  teamLeader,
  type Decision,
  type TeamRecord,
  type TeamStatus,
} from "@/lib/admin/types";
import { bulkDecide } from "./actions";

const STATUSES: TeamStatus[] = ["pending", "accepted", "waitlisted", "rejected"];
const DECISION_LABEL: Record<Decision, string> = {
  accepted: "Accept",
  waitlisted: "Waitlist",
  rejected: "Reject",
};

export default function ReviewQueue({ teams }: { teams: TeamRecord[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [statusOn, setStatusOn] = useState<Set<TeamStatus>>(new Set());
  const [completeness, setCompleteness] = useState<"all" | "full" | "partial">("all");
  const [institution, setInstitution] = useState("all");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const institutions = useMemo(() => {
    const s = new Set<string>();
    for (const t of teams)
      for (const m of t.members) if (m.institution) s.add(m.institution);
    return [...s].sort();
  }, [teams]);

  const counts = useMemo(() => {
    const c: Record<TeamStatus, number> = {
      pending: 0,
      accepted: 0,
      waitlisted: 0,
      rejected: 0,
    };
    for (const t of teams) c[t.status]++;
    return c;
  }, [teams]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = teams.filter((t) => {
      if (statusOn.size && !statusOn.has(t.status)) return false;
      if (flaggedOnly && !t.flagged) return false;
      if (completeness !== "all") {
        const full = t.members.length >= 3;
        if (completeness === "full" && !full) return false;
        if (completeness === "partial" && full) return false;
      }
      if (institution !== "all" && !t.members.some((m) => m.institution === institution))
        return false;
      if (q) {
        const hay = [
          t.team_code,
          t.name,
          ...t.members.flatMap((m) => [m.full_name, m.email]),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    rows.sort((a, b) => {
      const d = a.created_at.localeCompare(b.created_at);
      return sortDir === "asc" ? d : -d;
    });
    return rows;
  }, [teams, query, statusOn, flaggedOnly, completeness, institution, sortDir]);

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((t) => selected.has(t.team_code));

  // "export filtered": only the teams currently matching the filters above
  const filteredCodes = filtered.map((t) => t.team_code).join(",");
  const filteredPartCount = filtered.reduce((n, t) => n + t.members.length, 0);
  const exportUrl = (kind: "participants" | "teams") =>
    `/admin/export?type=${kind}&codes=${encodeURIComponent(filteredCodes)}`;

  function toggleStatus(s: TeamStatus) {
    setStatusOn((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }
  function toggleRow(code: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }
  function toggleAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) filtered.forEach((t) => next.delete(t.team_code));
      else filtered.forEach((t) => next.add(t.team_code));
      return next;
    });
  }

  function runBulk(decision: Decision) {
    const codes = [...selected];
    if (!codes.length) return;
    setError(null);
    startTransition(async () => {
      const res = await bulkDecide(codes, decision);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <section className={cn(selected.size > 0 && "pb-24")}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-4xl uppercase">Review queue</h1>
        <p className="font-body text-caption text-bone/60">
          {filtered.length} of {teams.length} teams
        </p>
      </div>

      {/* status summary */}
      <div className="mt-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => toggleStatus(s)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-caption font-medium uppercase tracking-wide transition-colors",
              statusOn.has(s)
                ? "border-orange/40 bg-orange/10 text-bone"
                : "border-bone/10 bg-surface text-bone/60 hover:text-bone",
            )}
          >
            {s} · {counts[s]}
          </button>
        ))}
      </div>

      {/* controls */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative grow sm:grow-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-bone/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search code, name, member…"
            className="w-full rounded-lg border border-bone/15 bg-surface py-2 pl-9 pr-3 text-sm outline-none placeholder:text-bone/45 focus-visible:border-orange sm:w-72"
          />
        </div>

        <select
          value={completeness}
          onChange={(e) => setCompleteness(e.target.value as typeof completeness)}
          className="rounded-lg border border-bone/15 bg-surface px-3 py-2 text-sm outline-none focus-visible:border-orange"
        >
          <option value="all">All sizes</option>
          <option value="full">Full (3/3)</option>
          <option value="partial">Partial</option>
        </select>

        <select
          value={institution}
          onChange={(e) => setInstitution(e.target.value)}
          className="rounded-lg border border-bone/15 bg-surface px-3 py-2 text-sm outline-none focus-visible:border-orange"
        >
          <option value="all">All institutions</option>
          {institutions.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setFlaggedOnly((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors",
            flaggedOnly
              ? "border-orange/40 bg-orange/10 text-bone"
              : "border-bone/15 bg-surface text-bone/60 hover:text-bone",
          )}
        >
          <Flag className="size-3.5" /> Flagged
        </button>

        <button
          type="button"
          onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
          className="rounded-lg border border-bone/15 bg-surface px-3 py-2 text-sm text-bone/70 hover:text-bone"
        >
          Submitted {sortDir === "desc" ? "↓ newest" : "↑ oldest"}
        </button>

        {/* export exactly what these filters show */}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="text-caption uppercase tracking-wide text-bone/45">
            Export filtered
          </span>
          {filtered.length > 0 ? (
            <>
              <a
                href={exportUrl("participants")}
                className={adminButton("secondary")}
              >
                ↓ Participants ({filteredPartCount})
              </a>
              <a href={exportUrl("teams")} className={adminButton("secondary")}>
                ↓ Teams ({filtered.length})
              </a>
            </>
          ) : (
            <span className={cn(adminButton("secondary"), "pointer-events-none opacity-40")}>
              ↓ No matches
            </span>
          )}
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {/* table */}
      <div className="mt-5 overflow-x-auto rounded-xl border border-bone/10">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-surface text-caption uppercase tracking-wide text-bone/55">
            <tr>
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allVisibleSelected}
                  onChange={toggleAllVisible}
                  className="size-4 accent-orange"
                />
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">Team</th>
              <th scope="col" className="px-3 py-3 font-semibold">Members</th>
              <th scope="col" className="px-3 py-3 font-semibold">Institution</th>
              <th scope="col" className="px-3 py-3 font-semibold">Submitted</th>
              <th scope="col" className="px-3 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const leader = teamLeader(t);
              const isSel = selected.has(t.team_code);
              return (
                <tr
                  key={t.id}
                  className={cn(
                    "border-t border-bone/8 transition-colors",
                    isSel ? "bg-orange/5" : "hover:bg-surface/60",
                  )}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ${t.team_code}`}
                      checked={isSel}
                      onChange={() => toggleRow(t.team_code)}
                      className="size-4 accent-orange"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/admin/teams/${t.team_code}`}
                      className="flex items-center gap-2 font-medium text-bone hover:text-orange"
                    >
                      {t.flagged ? (
                        <Flag className="size-3.5 shrink-0 text-orange" />
                      ) : null}
                      <span className="truncate">{t.name}</span>
                    </Link>
                    <span className="font-body text-caption text-bone/55">
                      {t.team_code}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        t.members.length >= 3 ? "text-bone/80" : "text-orange",
                      )}
                    >
                      {t.members.length}/3
                    </span>
                  </td>
                  <td className="px-3 py-3 text-bone/70">
                    {leader?.institution ?? "n/a"}
                  </td>
                  <td className="px-3 py-3 text-bone/60">
                    {fmtDateTime(t.created_at)}
                  </td>
                  <td className="px-3 py-3">
                    <StatusChip status={t.status} />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-bone/50">
                  No teams match these filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* bulk action bar */}
      {selected.size > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-bone/15 bg-surface-2/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
            <span className="text-sm text-bone/80">
              {selected.size} selected
            </span>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="inline-flex items-center gap-1 text-sm text-bone/50 hover:text-bone"
            >
              <X className="size-3.5" /> Clear
            </button>
            <div className="ml-auto flex flex-wrap gap-2">
              {DECISIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  disabled={pending}
                  onClick={() => runBulk(d)}
                  className={cn(
                    "rounded-lg px-4 py-2 text-caption font-semibold uppercase tracking-wide transition-opacity disabled:opacity-50",
                    d === "accepted"
                      ? "bg-orange text-court"
                      : d === "waitlisted"
                        ? "bg-blue text-bone"
                        : "border border-bone/20 text-bone/80 hover:bg-bone/5",
                  )}
                >
                  {DECISION_LABEL[d]}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
