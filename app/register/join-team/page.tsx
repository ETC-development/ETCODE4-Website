import Link from "next/link";
import JoinTeamForm from "@/components/sections/register/JoinTeamForm";

export const metadata = { title: "Join Team" };

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function JoinTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  const initialCode = one((await searchParams).code);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/register"
        className="font-body text-caption uppercase tracking-[0.18em] text-chalk/55 transition-colors hover:text-bone"
      >
        ← All paths
      </Link>
      <p className="mt-6 font-body text-caption uppercase tracking-[0.3em] text-orange">
        Join Team
      </p>
      <h1 className="mt-3 font-display text-[clamp(2.4rem,1.8rem+3vw,4rem)] uppercase leading-[0.9] tracking-tight text-bone">
        Sign with a team
      </h1>
      <p className="mt-4 max-w-[52ch] font-body text-lead font-light leading-relaxed text-bone/75">
        {initialCode
          ? "Your leader's invite is loaded. Just add your details below and you're on the roster."
          : "Enter the team code from your leader and your details. We'll add you if the roster has an open spot."}
      </p>

      <div className="mt-10 rounded-3xl border border-chalk/12 bg-court/40 p-6 sm:p-9">
        <JoinTeamForm initialCode={initialCode} />
      </div>
    </div>
  );
}
