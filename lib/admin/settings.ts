import "server-only";
import { supabaseSession } from "@/lib/supabase/session";
import type { AdminRole } from "@/lib/auth";

export type Settings = {
  registration_open: boolean;
  max_teams: number | null;
};

export type AdminRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: AdminRole;
  created_at: string;
};

export async function getSettings(): Promise<Settings> {
  const sb = await supabaseSession();
  const { data } = await sb
    .from("settings")
    .select("registration_open, max_teams")
    .eq("id", 1)
    .maybeSingle();
  return {
    registration_open: data?.registration_open !== false,
    max_teams: (data?.max_teams as number | null) ?? null,
  };
}

export async function listAdmins(): Promise<AdminRow[]> {
  const sb = await supabaseSession();
  const { data } = await sb
    .from("admins")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: true });
  return (data ?? []) as AdminRow[];
}
