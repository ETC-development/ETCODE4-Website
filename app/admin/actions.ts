"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseSession } from "@/lib/supabase/session";
import { hit, clientKey } from "@/lib/rate-limit";

const credentials = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type SignInState = { error?: string };

const BAD = "Wrong email or password.";
const TOO_MANY = "Too many attempts. Wait a minute and try again.";

export async function signIn(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  if (!hit(await clientKey("admin-login"), 10, 60_000))
    return { error: TOO_MANY };

  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: BAD };

  const sb = await supabaseSession();
  const { error } = await sb.auth.signInWithPassword(parsed.data);
  if (error) return { error: BAD };

  // hr_checkin lands on check-in; everyone else on the dashboard. The
  // (protected) layout re-checks and will bounce hr_checkin off other routes.
  redirect("/admin");
}

export async function signOut(): Promise<void> {
  const sb = await supabaseSession();
  await sb.auth.signOut();
  redirect("/admin/login");
}
