export type TeamStatus = "pending" | "accepted" | "waitlisted" | "rejected";
export type Decision = Exclude<TeamStatus, "pending">; // accepted | waitlisted | rejected

export const DECISIONS: Decision[] = ["accepted", "waitlisted", "rejected"];

export type RosterMember = {
  id: string;
  role: "leader" | "member" | "solo";
  full_name: string;
  email: string;
  phone: string | null;
  institution: string | null;
  study_year: string | null;
  leetcode: string | null;
  hackerrank: string | null;
  github: string | null;
  motivation: string | null;
  tshirt_size: string | null;
};

export type TeamRecord = {
  id: string;
  team_code: string;
  name: string;
  assigned_name: string | null;
  created_at: string;
  status: TeamStatus;
  flagged: boolean;
  reviewed_at: string | null;
  reviewed_by: string | null;
  decision_note: string | null;
  internal_note: string | null;
  members: RosterMember[];
};

export type AdminLite = {
  id: string;
  full_name: string | null;
  email: string;
};

export type EmailRecord = {
  id: string;
  template: string;
  to_email: string;
  status: string;
  error: string | null;
  created_at: string;
};

export type PendingTeam = { code: string; name: string };

export type EmailLogRow = {
  id: string;
  template: string;
  to_email: string;
  status: string;
  error: string | null;
  created_at: string;
  team: { team_code: string; name: string } | null;
};

export function memberCount(t: Pick<TeamRecord, "members">): number {
  return t.members.length;
}

export function completeness(n: number): "full" | "partial" {
  return n >= 3 ? "full" : "partial";
}

export function teamLeader(t: TeamRecord): RosterMember | undefined {
  return t.members.find((m) => m.role === "leader") ?? t.members[0];
}
