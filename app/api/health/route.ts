import { supabaseServer } from "@/lib/supabase/server";

// Keep-alive: a trivial DB read so the free Supabase project never hits the
// 7-day inactivity pause (ADMIN.md §10). Hit daily by the Vercel cron
// (vercel.json) or an external monitor (e.g. UptimeRobot).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  // Fail closed: CRON_SECRET must be configured AND match. This route spins up
  // the service-role client, so an open endpoint is a free privileged-DB oracle.
  // Vercel cron sends `Authorization: Bearer <CRON_SECRET>` automatically; for an
  // external monitor (UptimeRobot) set the same header in the monitor config.
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const db = supabaseServer();
    const { error } = await db
      .from("settings")
      .select("id", { head: true, count: "exact" })
      .eq("id", 1);
    if (error) throw error;
    return Response.json(
      { ok: true, ts: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { ok: false },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
