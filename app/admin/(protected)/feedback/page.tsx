import { requireRole } from "@/lib/auth";
import { isEmailConfigured } from "@/lib/email";
import { getFeedbackAdminData, type SendCounts } from "@/lib/admin/feedback";
import { PageHeader } from "@/components/admin/ui";
import FeedbackBulkSend from "./FeedbackBulkSend";
import ContributorImport from "./ContributorImport";
import AnalyticsTabs from "./AnalyticsTabs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function rate(c: SendCounts): string {
  if (c.invited === 0) return "—";
  return `${Math.round((c.submitted / c.invited) * 100)}%`;
}

function RateKpi({
  label,
  counts,
  accent,
}: {
  label: string;
  counts: SendCounts;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-bone/10 bg-surface px-4 py-3">
      <p className={`font-display text-4xl tabular-nums ${accent ? "text-orange" : "text-bone"}`}>
        {rate(counts)}
      </p>
      <p className="mt-1 font-body text-caption uppercase tracking-wide text-bone/60">
        {label}
      </p>
      <p className="mt-0.5 text-caption text-bone/40">
        {counts.submitted}/{counts.invited} replied · {counts.total} eligible
      </p>
    </div>
  );
}

export default async function FeedbackPage() {
  await requireRole("super_admin");
  const configured = isEmailConfigured();
  const data = await getFeedbackAdminData();

  return (
    <section className="mx-auto max-w-5xl">
      <PageHeader
        title="Feedback"
        subtitle="Post-event feedback for accepted participants and contributors (organizers & mentors). Invites mirror the acceptance/rejection flow; responses are anonymous."
      />

      {!configured ? (
        <p className="mt-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          Email isn&apos;t configured. Set <code>EMAIL_HOST</code>, <code>EMAIL_USER</code>,
          and <code>EMAIL_PASS</code> to enable sending.
        </p>
      ) : null}

      {/* response-rate KPIs */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <RateKpi label="Participants" counts={data.participants} accent />
        <RateKpi label="Organizers" counts={data.contributors.organizer} />
        <RateKpi label="Mentors" counts={data.contributors.mentor} />
      </div>

      {/* preview templates */}
      <div className="mt-6 rounded-xl border border-bone/10 bg-surface p-4">
        <h2 className="font-body text-caption font-semibold uppercase tracking-[0.16em] text-bone/55">
          Preview invites
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["participant", "organizer", "mentor"] as const).map((a) => (
            <a
              key={a}
              href={`/admin/feedback/preview?audience=${a}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-bone/20 px-3 py-2 text-caption font-semibold uppercase tracking-wide text-bone/80 transition-colors hover:border-orange/40 hover:text-bone"
            >
              {a} invite ↗
            </a>
          ))}
        </div>
      </div>

      {/* send */}
      <h2 className="mt-8 font-body text-caption font-semibold uppercase tracking-[0.16em] text-bone/55">
        Send invites
      </h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <FeedbackBulkSend
          items={data.pendingParticipants.map((p) => ({ id: p.id, name: p.name }))}
          kind="participant"
          title="Invite participants"
        />
        <FeedbackBulkSend
          items={data.pendingContributors.map((c) => ({ id: c.id, name: c.name }))}
          kind="contributor"
          title="Invite contributors"
        />
      </div>

      {/* import contributors */}
      <div className="mt-4">
        <ContributorImport />
        {data.contributorRows.length ? (
          <div className="mt-3 overflow-x-auto rounded-xl border border-bone/10">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-surface text-caption uppercase tracking-wide text-bone/55">
                <tr>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Name</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Email</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Role</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.contributorRows.map((c) => (
                  <tr key={c.id} className="border-t border-bone/8">
                    <td className="px-3 py-2.5 text-bone/85">{c.full_name}</td>
                    <td className="px-3 py-2.5 text-bone/60">{c.email}</td>
                    <td className="px-3 py-2.5 capitalize text-bone/70">{c.role}</td>
                    <td className="px-3 py-2.5">
                      {c.submitted ? (
                        <span className="text-orange">Replied</span>
                      ) : c.sent ? (
                        <span className="text-chalk">Invited</span>
                      ) : (
                        <span className="text-bone/45">Not sent</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {/* analytics */}
      <h2 className="mt-10 font-body text-caption font-semibold uppercase tracking-[0.16em] text-bone/55">
        Results
      </h2>
      <div className="mt-4">
        <AnalyticsTabs analytics={data.analytics} />
      </div>
    </section>
  );
}
