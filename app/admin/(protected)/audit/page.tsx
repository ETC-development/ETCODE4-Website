import { requireRole } from "@/lib/auth";
import { listAuditLog } from "@/lib/admin/audit";
import { PageHeader } from "@/components/admin/ui";
import AuditTable from "./AuditTable";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  await requireRole("manager");
  const entries = await listAuditLog();
  return (
    <section>
      <PageHeader
        title="Activity log"
        subtitle="Every decision, email, role change, and settings edit. Newest first."
      />
      <AuditTable entries={entries} />
    </section>
  );
}
