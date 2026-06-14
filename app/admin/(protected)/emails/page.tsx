import { requireRole } from "@/lib/auth";
import { isEmailConfigured } from "@/lib/email";
import { getPending, listEmailLog } from "@/lib/admin/emails";
import { fmtDateTime } from "@/lib/admin/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/ui";
import BulkSend from "./BulkSend";
import RetryButton from "./RetryButton";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATUS_STYLE: Record<string, string> = {
  sent: "text-orange",
  queued: "text-chalk",
  failed: "text-danger",
};

export default async function EmailsPage() {
  await requireRole("super_admin");
  const configured = isEmailConfigured();
  const [pendingAccept, pendingReject, log] = await Promise.all([
    getPending("acceptance"),
    getPending("rejection"),
    listEmailLog(),
  ]);

  return (
    <section className="mx-auto max-w-4xl">
      <PageHeader
        title="Emails"
        subtitle="Acceptance, rejection, reminder & check-in QR. Per-team sends live on each team's page."
      />

      {!configured ? (
        <p className="mt-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          Email isn&apos;t configured. Set <code>EMAIL_HOST</code>,{" "}
          <code>EMAIL_USER</code>, and <code>EMAIL_PASS</code> in{" "}
          <code>.env.local</code> to enable sending.
        </p>
      ) : null}

      {/* preview templates (opens the rendered email in a new tab) */}
      <div className="mt-6 rounded-xl border border-bone/10 bg-surface p-4">
        <h2 className="font-body text-caption font-semibold uppercase tracking-[0.16em] text-bone/55">
          Preview templates
        </h2>
        <p className="mt-1 text-caption text-bone/55">
          See exactly what each email looks like (sample data, QR codes included).
          To preview a real team and edit subject/message before sending, open
          that team&apos;s page → “Send decision email”.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["acceptance", "rejection", "reminder", "checkin_qr"] as const).map(
            (t) => (
              <a
                key={t}
                href={`/admin/emails/preview?template=${t}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-bone/20 px-3 py-2 text-caption font-semibold uppercase tracking-wide text-bone/80 transition-colors hover:border-orange/40 hover:text-bone"
              >
                {t.replace("_", " ")} ↗
              </a>
            ),
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <BulkSend
          pending={pendingAccept}
          template="acceptance"
          title="Send acceptances"
          noun="acceptance"
        />
        <BulkSend
          pending={pendingReject}
          template="rejection"
          title="Send rejections"
          noun="rejection"
        />
      </div>

      <h2 className="mt-10 font-body text-caption font-semibold uppercase tracking-[0.16em] text-bone/55">
        Email log
      </h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-bone/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-surface text-caption uppercase tracking-wide text-bone/55">
            <tr>
              <th scope="col" className="px-3 py-3 font-semibold">Template</th>
              <th scope="col" className="px-3 py-3 font-semibold">Team</th>
              <th scope="col" className="px-3 py-3 font-semibold">To</th>
              <th scope="col" className="px-3 py-3 font-semibold">Status</th>
              <th scope="col" className="px-3 py-3 font-semibold">When</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {log.map((e) => (
              <tr key={e.id} className="border-t border-bone/8">
                <td className="px-3 py-3 capitalize text-bone/80">{e.template}</td>
                <td className="px-3 py-3 text-bone/70">
                  {e.team ? `${e.team.name} · ${e.team.team_code}` : "n/a"}
                </td>
                <td className="px-3 py-3 text-bone/60">{e.to_email}</td>
                <td className="px-3 py-3">
                  <span
                    className={cn(
                      "font-medium capitalize",
                      STATUS_STYLE[e.status] ?? "text-bone/70",
                    )}
                  >
                    {e.status}
                  </span>
                  {e.error ? (
                    <span
                      className="ml-1 text-caption text-bone/55"
                      title={e.error}
                    >
                      ⓘ
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-3 text-bone/50">
                  {fmtDateTime(e.created_at)}
                </td>
                <td className="px-3 py-3">
                  {e.status === "failed" ? <RetryButton emailId={e.id} /> : null}
                </td>
              </tr>
            ))}
            {log.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-bone/55">
                  No emails sent yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
