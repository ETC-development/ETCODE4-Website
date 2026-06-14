import Link from "next/link";
import CreateTeamForm from "@/components/sections/register/CreateTeamForm";

export const metadata = { title: "Create Team" };

export default function CreateTeamPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/register"
        className="font-body text-caption uppercase tracking-[0.18em] text-chalk/55 transition-colors hover:text-bone"
      >
        ← All paths
      </Link>
      <p className="mt-6 font-body text-caption uppercase tracking-[0.3em] text-orange">
        Create Team
      </p>
      <h1 className="mt-3 font-display text-[clamp(2.4rem,1.8rem+3vw,4rem)] uppercase leading-[0.9] tracking-tight text-bone">
        Draft your roster
      </h1>
      <p className="mt-4 max-w-[52ch] font-body text-lead font-light leading-relaxed text-bone/75">
        Name your squad and register yourself as leader. You&apos;ll get a team
        code to share with your 2 teammates.
      </p>

      <div className="mt-10 rounded-3xl border border-chalk/12 bg-court/40 p-6 sm:p-9">
        <CreateTeamForm />
      </div>
    </div>
  );
}
