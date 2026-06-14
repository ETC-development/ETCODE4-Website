import { requireRole } from "@/lib/auth";
import { getBoardSnapshot } from "@/lib/admin/board";
import BoardClient from "./BoardClient";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  await requireRole("hr_checkin");
  const initial = await getBoardSnapshot();
  return <BoardClient initial={initial} />;
}
