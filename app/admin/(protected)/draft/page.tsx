import { requireRole } from "@/lib/auth";
import { listSolos } from "@/lib/admin/draft";
import DraftBoard from "./DraftBoard";

export const dynamic = "force-dynamic";

export default async function DraftPage() {
  await requireRole("manager");
  const solos = await listSolos();
  return <DraftBoard solos={solos} />;
}
