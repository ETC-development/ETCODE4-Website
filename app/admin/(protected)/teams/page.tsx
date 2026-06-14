import { requireRole } from "@/lib/auth";
import { listTeams } from "@/lib/admin/teams";
import { BtnLink } from "@/components/admin/ui";
import ReviewQueue from "./ReviewQueue";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  await requireRole("manager");
  const teams = await listTeams();
  return (
    <>
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <BtnLink href="/admin/export?type=participants" size="sm">
          ↓ Participants CSV
        </BtnLink>
        <BtnLink href="/admin/export?type=teams" size="sm">
          ↓ Teams CSV
        </BtnLink>
        <BtnLink href="/admin/export?type=attendance" size="sm">
          ↓ Attendance CSV
        </BtnLink>
      </div>
      <ReviewQueue teams={teams} />
    </>
  );
}
