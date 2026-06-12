import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import CountUp from "@/components/ui/CountUp";
import { ABOUT, STATS, PILLARS } from "@/lib/content";
import { cn } from "@/lib/utils";

export default function About() {
  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="relative overflow-hidden px-6 py-28 sm:px-10 sm:py-36"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05]">
        <Image src="/court/halfcourt.webp" alt="" fill sizes="100vw" className="object-cover" />
      </div>

      <div className="mx-auto grid w-full max-w-[120rem] gap-x-16 gap-y-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeading number="02" eyebrow="About" title="The Game" titleId="about-title" />
        </div>

        <Reveal
          className="self-end lg:col-span-7 lg:col-start-6"
          delay={0.1}
        >
          <p className="max-w-[60ch] font-body text-lead font-light leading-[1.5] text-bone/85">
            {ABOUT}
          </p>
        </Reveal>
      </div>

      <div className="mx-auto mt-20 w-full max-w-[120rem] border-y border-chalk/15">
        <dl className="grid grid-cols-2 md:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal
              key={s.label}
              delay={i * 0.08}
              className={cn(
                "flex flex-col gap-2 px-2 py-8 sm:px-6",
                i !== 0 && "md:border-l md:border-chalk/15",
                i % 2 !== 0 && "border-l border-chalk/15 md:border-l",
                i >= 2 && "border-t border-chalk/15 md:border-t-0",
              )}
            >
              <dd
                className={cn(
                  "font-display text-[clamp(2.8rem,2rem+5vw,5.5rem)] leading-[0.85] tabular-nums",
                  i === 0 ? "text-orange" : "text-bone",
                )}
              >
                <CountUp value={s.value} />
              </dd>
              <dt className="font-body text-caption uppercase tracking-[0.18em] text-chalk/55">
                {s.label}
              </dt>
            </Reveal>
          ))}
        </dl>
      </div>

      <div className="mx-auto mt-20 grid w-full max-w-[120rem] items-stretch gap-6 md:grid-cols-3">
        {PILLARS.map((p, i) => (
          <Reveal key={p.title} delay={i * 0.1} className="h-full">
            <div className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-chalk/12 bg-surface p-8 transition-[transform,background-color,border-color] duration-500 ease-[cubic-bezier(.16,1,.3,1)] hover:-translate-y-2 hover:border-orange/40 hover:bg-surface-2 sm:p-10">
              <div className="flex items-center justify-between">
                <span className="font-display text-[1.4rem] leading-none text-chalk/40 transition-colors duration-500 group-hover:text-orange">
                  {p.tag}
                </span>
                <span className="h-2.5 w-2.5 rounded-full bg-orange opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:shadow-[0_0_20px_var(--orange)]" />
              </div>
              <h3 className="font-display text-[clamp(1.8rem,1.4rem+1.6vw,2.6rem)] uppercase leading-none tracking-tight text-bone">
                {p.title}
              </h3>
              <p className="font-body text-body font-light leading-relaxed text-bone/75">
                {p.desc}
              </p>
              <span
                aria-hidden
                className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-orange transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-x-100"
              />
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
