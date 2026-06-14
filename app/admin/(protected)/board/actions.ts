"use server";

import { assertRole } from "@/lib/auth";
import { getBoardTick, type BoardTick } from "@/lib/admin/board";

// Polled by the live board. Server-driven (not browser Realtime) so the auth
// session stays HttpOnly — the browser never needs the token. Returns only
// aggregates + completed team codes; the grid's team list comes from the
// initial snapshot.
export async function getBoardTickAction(): Promise<BoardTick | null> {
  try {
    await assertRole("hr_checkin");
  } catch {
    return null;
  }
  return getBoardTick();
}
