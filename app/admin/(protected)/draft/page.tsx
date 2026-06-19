import { requireRole } from "@/lib/auth";
import { listSolos, listPartialTeams } from "@/lib/admin/draft";
import DraftBoard from "./DraftBoard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // rejectSolo sends email via Nodemailer

export default async function DraftPage() {
  const admin = await requireRole("manager");
  const [solos, partialTeams] = await Promise.all([
    listSolos(),
    listPartialTeams(),
  ]);
  return (
    <DraftBoard
      solos={solos}
      partialTeams={partialTeams}
      canReject={admin.role === "super_admin"}
    />
  );
}
