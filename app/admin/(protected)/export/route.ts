import { getAdmin, roleAtLeast } from "@/lib/auth";
import { supabaseSession } from "@/lib/supabase/session";
import { logAudit } from "@/lib/admin/audit";
import { csv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await getAdmin();
  if (!admin || !roleAtLeast(admin.role, "manager"))
    return new Response("Forbidden", { status: 403 });

  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? "participants";
  // Optional filter: restrict the export to a set of team codes (used by the
  // review queue's "export filtered" so the CSV matches the on-screen filters).
  const codesParam = url.searchParams.get("codes");
  const codeSet =
    codesParam !== null
      ? new Set(
          codesParam
            .split(",")
            .map((c) => c.trim().toUpperCase())
            .filter((c) => /^ET4-[A-Z0-9]{5}$/.test(c)),
        )
      : null;
  // Optional team-status filter, e.g. ?status=accepted (or a comma list).
  const statusParam = url.searchParams.get("status");
  const statusSet = statusParam
    ? new Set(
        statusParam
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean),
      )
    : null;
  // Optional institution filter on participants: ?institution=ENSIA, plus
  // &exclude=1 to invert it ("everyone NOT from ENSIA").
  const institution = url.searchParams.get("institution")?.trim() || null;
  const exclude = url.searchParams.get("exclude") === "1";

  const suffixParts: string[] = [];
  if (statusSet) suffixParts.push([...statusSet].join("-"));
  if (institution)
    suffixParts.push((exclude ? "non-" : "") + institution.replace(/\s+/g, ""));
  if (codeSet) suffixParts.push("filtered");
  const suffix = suffixParts.length ? `-${suffixParts.join("-")}` : "";
  const sb = await supabaseSession();

  let rows: (string | number | null)[][];
  let filename: string;

  if (type === "attendance") {
    const { data } = await sb
      .from("check_ins")
      .select(
        "checked_in_at, session:checkin_sessions(label), by:admins!checked_in_by(full_name), participant:participants(full_name, team:teams(team_code, name))",
      )
      .order("checked_in_at", { ascending: true });
    filename = "etcode4-attendance.csv";
    rows = [["checked_in_at", "session", "participant", "team_code", "team_name", "checked_in_by"]];
    const one = (v: unknown) => (Array.isArray(v) ? v[0] : v) as Record<string, unknown> | null;
    for (const r of (data ?? []) as Record<string, unknown>[]) {
      const session = one(r.session);
      const by = one(r.by);
      const p = one(r.participant);
      const team = one(p?.team);
      rows.push([
        r.checked_in_at as string,
        (session?.label as string) ?? "",
        (p?.full_name as string) ?? "",
        (team?.team_code as string) ?? "",
        (team?.name as string) ?? "",
        (by?.full_name as string) ?? "",
      ]);
    }
  } else if (type === "teams") {
    const { data } = await sb
      .from("teams")
      .select(
        "team_code, name, status, flagged, created_at, members:participants(id)",
      )
      .order("created_at", { ascending: true });
    filename = `etcode4-teams${suffix}.csv`;
    rows = [["team_code", "name", "status", "flagged", "members", "created_at"]];
    let teamRows = (data ?? []) as {
      team_code: string;
      name: string;
      status: string;
      flagged: boolean;
      created_at: string;
      members: { id: string }[];
    }[];
    teamRows = teamRows.filter((t) => {
      if (codeSet && !codeSet.has(t.team_code)) return false;
      if (statusSet && !statusSet.has(t.status)) return false;
      return true;
    });
    for (const t of teamRows) {
      rows.push([
        t.team_code,
        t.name,
        t.status,
        t.flagged ? "yes" : "",
        t.members?.length ?? 0,
        t.created_at,
      ]);
    }
  } else {
    const { data } = await sb
      .from("participants")
      .select(
        "full_name, email, phone, institution, study_year, role, tshirt_size, leetcode, hackerrank, github, team:teams(team_code, name, status)",
      )
      .order("created_at", { ascending: true });
    filename = `etcode4-participants${suffix}.csv`;
    rows = [
      [
        "full_name",
        "email",
        "phone",
        "institution",
        "study_year",
        "role",
        "tshirt_size",
        "team_code",
        "team_name",
        "team_status",
        "leetcode",
        "hackerrank",
        "github",
      ],
    ];
    let partRows = (data ?? []) as Record<string, unknown>[];
    partRows = partRows.filter((p) => {
      const t = (Array.isArray(p.team) ? p.team[0] : p.team) as
        | { team_code?: string; status?: string }
        | null;
      if (codeSet && !(t?.team_code && codeSet.has(t.team_code))) return false;
      if (statusSet && !(t?.status && statusSet.has(t.status))) return false;
      if (institution) {
        const isInst = p.institution === institution;
        if (exclude ? isInst : !isInst) return false;
      }
      return true;
    });
    for (const p of partRows) {
      const team = (Array.isArray(p.team) ? p.team[0] : p.team) as
        | { team_code?: string; name?: string; status?: string }
        | null;
      rows.push([
        p.full_name as string,
        p.email as string,
        (p.phone as string) ?? "",
        (p.institution as string) ?? "",
        (p.study_year as string) ?? "",
        p.role as string,
        (p.tshirt_size as string) ?? "",
        team?.team_code ?? "",
        team?.name ?? "",
        team?.status ?? "",
        (p.leetcode as string) ?? "",
        (p.hackerrank as string) ?? "",
        (p.github as string) ?? "",
      ]);
    }
  }

  // Bulk PII leaves the system here — log who exported what and how many rows
  // (header row excluded) so exfiltration is visible in the audit trail.
  await logAudit(admin.id, "data.export", type, {
    rows: rows.length - 1,
    status: statusParam ?? null,
    institution: institution ? (exclude ? `not:${institution}` : institution) : null,
    codes: codeSet ? codeSet.size : null,
  });

  return new Response("﻿" + csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
