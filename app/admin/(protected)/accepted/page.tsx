import { requireRole } from "@/lib/auth";
import { listAcceptedTeams } from "@/lib/admin/teams";
import { PageHeader, EmptyState } from "@/components/admin/ui";
import AcceptedTeams from "./AcceptedTeams";

export const dynamic = "force-dynamic";

export default async function AcceptedTeamsPage() {
  await requireRole("super_admin");
  const teams = await listAcceptedTeams();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Accepted teams"
        subtitle="Confirmed rosters. Expand a team to edit member info — e.g. when a participant is replaced."
      />
      {teams.length === 0 ? (
        <EmptyState>No accepted teams yet.</EmptyState>
      ) : (
        <AcceptedTeams teams={teams} />
      )}
    </div>
  );
}
