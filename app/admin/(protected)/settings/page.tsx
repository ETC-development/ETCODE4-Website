import { requireRole } from "@/lib/auth";
import { getSettings, listAdmins } from "@/lib/admin/settings";
import { listSessions } from "@/lib/admin/checkin";
import { PageHeader } from "@/components/admin/ui";
import SettingsForm from "./SettingsForm";
import AdminManager from "./AdminManager";
import SessionManager from "../checkin/SessionManager";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // admin create/delete hits the GoTrue admin API

export default async function SettingsPage() {
  const admin = await requireRole("super_admin");
  const [settings, admins, sessions] = await Promise.all([
    getSettings(),
    listAdmins(),
    listSessions(),
  ]);

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Settings" />

      <SettingsForm initial={settings} />
      <SessionManager sessions={sessions} canDelete />
      <AdminManager admins={admins} selfId={admin.id} />

      <div className="rounded-xl border border-bone/10 bg-surface p-5">
        <h2 className="font-body text-caption font-semibold uppercase tracking-[0.16em] text-bone/50">
          Export
        </h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <a
            href="/admin/export?type=participants"
            className="rounded-lg border border-bone/20 px-4 py-2 text-caption font-semibold uppercase tracking-wide text-bone/80 hover:border-orange/40 hover:text-bone"
          >
            Participants CSV
          </a>
          <a
            href="/admin/export?type=teams"
            className="rounded-lg border border-bone/20 px-4 py-2 text-caption font-semibold uppercase tracking-wide text-bone/80 hover:border-orange/40 hover:text-bone"
          >
            Teams CSV
          </a>
          <a
            href="/admin/export?type=attendance"
            className="rounded-lg border border-bone/20 px-4 py-2 text-caption font-semibold uppercase tracking-wide text-bone/80 hover:border-orange/40 hover:text-bone"
          >
            Attendance CSV
          </a>
        </div>
      </div>
    </section>
  );
}
