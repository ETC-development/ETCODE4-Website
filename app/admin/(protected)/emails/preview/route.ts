import { getAdmin, roleAtLeast } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import {
  renderEmail,
  type EmailTemplate,
  type TeamEmailData,
} from "@/lib/emails/render";

// Standalone email preview — renders the actual template HTML in the browser so
// the sender can SEE and verify each email before sending. QR codes render as
// inline data URIs (preview mode). Use ?template=acceptance|rejection|reminder|
// checkin_qr and optionally ?code=ET4-XXXXX to preview a real team's data;
// without a code it uses representative sample data.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TEMPLATES: EmailTemplate[] = [
  "acceptance",
  "rejection",
  "reminder",
  "checkin_qr",
];

const SAMPLE: TeamEmailData = {
  teamName: "Court Vision",
  code: "ET4-7KQ2X",
  leaderName: "Amine Benali",
  note: "Loved your motivation. Bring that energy to the court.",
  members: [
    { name: "Amine Benali", qrToken: "a1b2c3d4e5f6a7b8c9" },
    { name: "Lina Haddad", qrToken: "b2c3d4e5f6a7b8c9d0" },
    { name: "Yacine Toumi", qrToken: "c3d4e5f6a7b8c9d0e1" },
  ],
};

export async function GET(request: Request) {
  const admin = await getAdmin();
  if (!admin || !roleAtLeast(admin.role, "super_admin"))
    return new Response("Forbidden", { status: 403 });

  const url = new URL(request.url);
  const templateParam = url.searchParams.get("template") ?? "acceptance";
  const template = (TEMPLATES.includes(templateParam as EmailTemplate)
    ? templateParam
    : "acceptance") as EmailTemplate;
  const code = url.searchParams.get("code")?.trim().toUpperCase();

  let data: TeamEmailData = SAMPLE;

  // Real team data when a valid code is supplied.
  if (code && /^ET4-[A-Z0-9]{5}$/.test(code)) {
    const db = supabaseServer();
    const { data: team } = await db
      .from("teams")
      .select(
        "team_code, name, assigned_name, decision_note, members:participants(role, full_name, qr_token)",
      )
      .eq("team_code", code)
      .maybeSingle();
    if (team) {
      const t = team as {
        team_code: string;
        name: string;
        assigned_name: string | null;
        decision_note: string | null;
        members: { role: string; full_name: string; qr_token: string | null }[];
      };
      data = {
        teamName: t.assigned_name || t.name,
        code: t.team_code,
        leaderName:
          t.members.find((m) => m.role === "leader")?.full_name ??
          t.members[0]?.full_name ??
          "there",
        note: t.decision_note ?? "",
        members: t.members.map((m) => ({
          name: m.full_name,
          qrToken: m.qr_token,
        })),
      };
    }
  }

  const { html } = await renderEmail(template, data, { mode: "preview" });

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
