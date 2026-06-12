import CopyCode from "@/components/sections/register/CopyCode";
import InviteLink from "@/components/sections/register/InviteLink";
import Reveal from "@/components/ui/Reveal";
import Button from "@/components/ui/Button";
import { EVENT } from "@/lib/content";

export const metadata = { title: "You're in" };

type SP = { [k: string]: string | string[] | undefined };

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function clampCount(v: string | string[] | undefined): number {
  const n = Math.trunc(Number(one(v)));
  return Number.isFinite(n) ? Math.min(3, Math.max(0, n)) : 3;
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const role = one(sp.role);
  const code = one(sp.code);
  const team = one(sp.team);
  const memberCount = clampCount(sp.count);

  const isLeader = role === "leader" && code;
  const isMember = role === "member";

  const eyebrow = isLeader
    ? "Roster drafted"
    : isMember
      ? "You're on the team"
      : role === "solo"
        ? "Free agent, registered"
        : "You're in";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-orange/50 bg-orange/10">
        <span className="font-display text-3xl text-orange">✓</span>
      </div>

      <p className="font-body text-caption uppercase tracking-[0.3em] text-orange">{eyebrow}</p>
      <h1 className="mt-3 font-display text-[clamp(2.6rem,1.8rem+4vw,4.5rem)] uppercase leading-[0.9] tracking-tight text-bone">
        {isLeader ? "Share the code" : isMember ? "You're signed" : "You're on the board"}
      </h1>

      {isLeader && (
        <div className="mt-8">
          <p className="mb-4 max-w-[52ch] font-body text-lead font-light leading-relaxed text-bone/75">
            {team ? <>Team <span className="text-bone">{team}</span> is on the board. </> : null}
            Share this code with your 2 teammates, they enter it on the{" "}
            <span className="text-bone">Join Team</span> path.
          </p>
          <Reveal delay={0.15} y={20}>
            <CopyCode code={code!} />
          </Reveal>

          <Reveal delay={0.25} y={20} className="mt-5">
            <p className="mb-3 font-body text-caption uppercase tracking-[0.2em] text-chalk/55">
              Or send the invite link
            </p>
            <InviteLink code={code!} />
          </Reveal>

          <p className="mt-5 font-body text-caption text-chalk/50">
            Roster: 1/3 (two spots open)
          </p>
        </div>
      )}

      {isMember && (
        <p className="mt-6 max-w-[52ch] font-body text-lead font-light leading-relaxed text-bone/75">
          {team ? <>You&apos;re on <span className="text-bone">{team}</span>. </> : "You're on the roster. "}
          Roster: <span className="text-bone">{memberCount}/3</span>.{" "}
          {memberCount === 3 ? "Squad complete. See you on the court." : "Waiting on the rest of the squad."}
        </p>
      )}

      {role === "solo" && (
        <p className="mt-6 max-w-[52ch] font-body text-lead font-light leading-relaxed text-bone/75">
          You&apos;re registered as a free agent. Admins will draft you onto a
          team before the contest. Keep an eye on your inbox.
        </p>
      )}

      {!isLeader && !isMember && role !== "solo" && (
        <p className="mt-6 max-w-[52ch] font-body text-lead font-light leading-relaxed text-bone/75">
          You&apos;re registered for {EVENT.name}. See you on the court.
        </p>
      )}

      <div className="mt-12 flex flex-wrap items-center gap-4">
        <Button href="/" variant="outline" magnetic={0.25}>
          ← Back to site
        </Button>
        <a
          href={`mailto:${EVENT.contactEmail}`}
          className="font-body text-caption uppercase tracking-[0.18em] text-chalk/55 transition-colors hover:text-bone"
        >
          Something off? Contact us
        </a>
      </div>
    </div>
  );
}
