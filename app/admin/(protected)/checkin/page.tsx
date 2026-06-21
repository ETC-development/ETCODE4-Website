import { requireRole, roleAtLeast } from "@/lib/auth";
import { getCheckinState, listSessions } from "@/lib/admin/checkin";
import CheckinClient from "./CheckinClient";
import SessionManager from "./SessionManager";

export const dynamic = "force-dynamic";

export default async function CheckinPage() {
  const admin = await requireRole("hr_checkin");
  const canManageSessions = roleAtLeast(admin.role, "manager");
  const canDeleteSessions = admin.role === "super_admin";

  const [state, sessions] = await Promise.all([
    getCheckinState(),
    canManageSessions ? listSessions() : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="font-display text-4xl uppercase">Check-in</h1>
        <p className="mt-1 text-sm text-bone/50">
          Scan each member&apos;s QR. Teams auto-complete at full roster.
        </p>
      </div>

      {canManageSessions ? (
        <SessionManager sessions={sessions} canDelete={canDeleteSessions} />
      ) : null}

      <CheckinClient initial={state} />
    </div>
  );
}
