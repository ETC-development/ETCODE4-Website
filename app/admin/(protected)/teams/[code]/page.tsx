import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import {
  adminDirectory,
  getTeamByCode,
  takenTeamNames,
  teamEmails,
} from "@/lib/admin/teams";
import { teamNameOptions } from "@/lib/team-names";
import { fmtDateTime } from "@/lib/admin/format";
import StatusChip from "@/components/admin/StatusChip";
import type { RosterMember } from "@/lib/admin/types";
import TeamControls from "./TeamControls";
import EmailComposer from "../../emails/EmailComposer";

export const dynamic = "force-dynamic";

const HANDLES: { key: keyof RosterMember; label: string }[] = [
  { key: "leetcode", label: "LeetCode" },
  { key: "hackerrank", label: "HackerRank" },
  { key: "github", label: "GitHub" },
];

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const admin = await requireRole("manager");
  const { code } = await params;
  const team = await getTeamByCode(code);
  if (!team) notFound();

  const [dir, emails, taken] = await Promise.all([
    adminDirectory(),
    teamEmails(team.id),
    takenTeamNames(team.id),
  ]);
  const nameOptions = teamNameOptions(taken);
  const reviewer = team.reviewed_by ? dir.get(team.reviewed_by) : undefined;
  const reviewerName = reviewer ? reviewer.full_name || reviewer.email : null;

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/admin/teams"
        className="inline-flex items-center gap-1.5 text-sm text-bone/50 hover:text-bone"
      >
        <ArrowLeft className="size-4" /> Review queue
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase">
            {team.assigned_name || team.name}
          </h1>
          <p className="mt-1 font-body text-caption text-bone/45">
            {team.assigned_name ? `“${team.name}” · ` : ""}
            {team.team_code} · submitted {fmtDateTime(team.created_at)} ·{" "}
            {team.members.length}/3 members
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusChip status={team.status} />
          {team.reviewed_at ? (
            <span className="font-body text-caption text-bone/40">
              {team.status} {fmtDateTime(team.reviewed_at)}
              {reviewerName ? ` · ${reviewerName}` : ""}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* roster */}
        <section>
          <h2 className="font-body text-caption font-semibold uppercase tracking-[0.16em] text-bone/50">
            Roster
          </h2>
          <ul className="mt-3 space-y-3">
            {team.members.map((m) => (
              <li
                key={m.id}
                className="rounded-xl border border-bone/10 bg-surface p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-bone">{m.full_name}</span>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-caption uppercase tracking-wide text-bone/55">
                    {m.role}
                  </span>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-bone/70">
                  <div className="col-span-2 sm:col-span-1">
                    <dt className="inline text-bone/55">Email: </dt>
                    <dd className="inline">{m.email}</dd>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <dt className="inline text-bone/55">Phone: </dt>
                    <dd className="inline">{m.phone ?? "n/a"}</dd>
                  </div>
                  <div>
                    <dt className="inline text-bone/55">Institution: </dt>
                    <dd className="inline">{m.institution ?? "n/a"}</dd>
                  </div>
                  <div>
                    <dt className="inline text-bone/55">Year: </dt>
                    <dd className="inline">{m.study_year ?? "n/a"}</dd>
                  </div>
                  {m.tshirt_size ? (
                    <div>
                      <dt className="inline text-bone/55">T-shirt: </dt>
                      <dd className="inline">{m.tshirt_size}</dd>
                    </div>
                  ) : null}
                </dl>

                <div className="mt-2 flex flex-wrap gap-3 text-caption">
                  {HANDLES.map(({ key, label }) => {
                    const url = m[key] as string | null;
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

                {m.motivation ? (
                  <p className="mt-2 border-l-2 border-bone/15 pl-3 text-sm italic text-bone/60">
                    {m.motivation}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>

          {/* email history */}
          <h2 className="mt-8 font-body text-caption font-semibold uppercase tracking-[0.16em] text-bone/50">
            Email history
          </h2>
          {emails.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-bone/12 px-4 py-6 text-center text-sm text-bone/50">
              No emails sent yet.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {emails.map((e) => (
                <li
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-bone/10 bg-surface px-3 py-2 text-sm"
                >
                  <span className="text-bone/80">
                    {e.template} → {e.to_email}
                  </span>
                  <span className="text-bone/45">
                    {e.status} · {fmtDateTime(e.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* decision controls */}
        <div className="space-y-6">
          <TeamControls
            code={team.team_code}
            status={team.status}
            flagged={team.flagged}
            decisionNote={team.decision_note ?? ""}
            internalNote={team.internal_note ?? ""}
            assignedName={team.assigned_name ?? ""}
            nameOptions={nameOptions}
          />
          {admin.role === "super_admin" ? (
            <EmailComposer code={team.team_code} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
