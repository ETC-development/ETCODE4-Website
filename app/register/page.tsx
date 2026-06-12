import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { EVENT } from "@/lib/content";

const PATHS = [
  {
    href: "/register/create-team",
    tag: "01",
    title: "Create Team",
    kicker: "Draft your roster.",
    desc: "Name your squad and register yourself as leader. You'll get a team code to share with your 2 teammates.",
    accent: true,
  },
  {
    href: "/register/join-team",
    tag: "02",
    title: "Join Team",
    kicker: "Sign with a team.",
    desc: "Already have a team code from your leader? Enter it with your details and take your spot on the roster.",
    accent: false,
  },
  {
    href: "/register/solo",
    tag: "03",
    title: "Solo",
    kicker: "Free agent.",
    desc: "No squad yet? Register solo. Admins will draft you onto a team. Priority goes to complete teams of 3.",
    accent: false,
  },
];

const STEPS = [
  { n: "01", t: "Pick your path", d: "Create a team, join one, or go solo." },
  { n: "02", t: "Lock your details", d: "Name, email, institution, CP handle." },
  { n: "03", t: "Get on the roster", d: "Leaders get a code to share. You're in." },
];

export default function RegisterPage() {
  return (
    <div>
      <Reveal>
        <p className="font-body text-caption uppercase tracking-[0.3em] text-orange">
          {EVENT.name} · Registration
        </p>
        <h1 className="mt-4 max-w-[14ch] font-display text-[clamp(2.6rem,1.8rem+4vw,5rem)] uppercase leading-[0.9] tracking-tight text-bone">
          Choose your path
        </h1>
        <p className="mt-5 max-w-[56ch] font-body text-lead font-light leading-relaxed text-bone/75">
          Teams are exactly {EVENT.teamSize}. Pick how you&apos;re getting on the
          court. Every player fills the same details once.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {PATHS.map((p, i) => (
          <Reveal key={p.href} delay={i * 0.08} className="h-full">
            <Link
              href={p.href}
              data-cursor="target"
              className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-chalk/12 bg-surface p-8 transition-[transform,border-color,background-color] duration-500 ease-[cubic-bezier(.16,1,.3,1)] hover:-translate-y-2 hover:border-orange/40 hover:bg-surface-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-[1.3rem] leading-none text-chalk/40 transition-colors duration-500 group-hover:text-orange">
                  {p.tag}
                </span>
                <span className="font-body text-2xl text-chalk/40 transition-all duration-500 group-hover:translate-x-1 group-hover:text-orange">
                  →
                </span>
              </div>
              <h2 className="font-display text-[clamp(1.8rem,1.4rem+1.6vw,2.4rem)] uppercase leading-none tracking-tight text-bone">
                {p.title}
              </h2>
              <p className="font-body text-body font-medium italic text-chalk/70">{p.kicker}</p>
              <p className="font-body text-body font-light leading-relaxed text-bone/70">{p.desc}</p>
              <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-orange transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-x-100" />
            </Link>
          </Reveal>
        ))}
      </div>

      <div className="mt-20 border-t border-chalk/12 pt-12">
        <h3 className="font-body text-caption uppercase tracking-[0.3em] text-chalk/55">
          How it works
        </h3>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="flex flex-col gap-2">
              <span className="font-display text-[1.6rem] leading-none text-orange/80">{s.n}</span>
              <p className="font-body text-lead font-medium text-bone">{s.t}</p>
              <p className="font-body text-body font-light leading-relaxed text-bone/65">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
