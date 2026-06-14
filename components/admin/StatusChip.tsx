import { cn } from "@/lib/utils";
import type { TeamStatus } from "@/lib/admin/types";

const DOT: Record<TeamStatus, string> = {
  pending: "bg-chalk",
  accepted: "bg-orange",
  waitlisted: "bg-blue",
  rejected: "bg-bone/30",
};

export default function StatusChip({
  status,
  className,
}: {
  status: TeamStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-bone/10 bg-surface-2 px-2.5 py-1 font-body text-caption font-medium uppercase tracking-wide text-bone/75",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOT[status])} aria-hidden />
      {status}
    </span>
  );
}
