"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import SectionHeading from "@/components/ui/SectionHeading";
import { AGENDA } from "@/lib/content";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function Agenda() {
  const reduced = useReducedMotion();
  const [day, setDay] = useState(0);
  const blocks = AGENDA[day]?.blocks ?? [];

  return (
    <section
      id="agenda"
      aria-labelledby="agenda-title"
      className="relative overflow-hidden px-6 py-28 sm:px-10 sm:py-36"
    >
      <div className="mx-auto grid w-full max-w-[120rem] gap-x-16 gap-y-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHeading number="04" eyebrow="Agenda" title="Game Schedule" titleId="agenda-title" />

          <div
            role="tablist"
            aria-label="Schedule days"
            className="mt-10 inline-flex flex-col gap-2"
          >
            {AGENDA.map((d, i) => (
              <button
                key={d.day}
                role="tab"
                aria-selected={i === day}
                onClick={() => setDay(i)}
                className={cn(
                  "group flex items-baseline gap-4 border-l-2 py-2 pl-4 text-left transition-colors duration-300",
                  i === day
                    ? "border-orange"
                    : "border-chalk/15 hover:border-chalk/40",
                )}
              >
                <span
                  className={cn(
                    "font-display text-[clamp(1.4rem,1.1rem+1vw,2rem)] uppercase leading-none tracking-tight transition-colors",
                    i === day ? "text-bone" : "text-chalk/50 group-hover:text-chalk/80",
                  )}
                >
                  {d.day}
                </span>
                <span className="font-body text-caption uppercase tracking-[0.2em] text-chalk/50">
                  {d.date}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 lg:col-start-6">
          {blocks.length === 0 ? (
            <div className="relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl border border-chalk/15 bg-surface/40 px-8 py-16">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06] [mask-image:radial-gradient(80%_80%_at_70%_40%,black,transparent)]"
                style={{ backgroundImage: "url('/court/halfcourt.webp')", backgroundSize: "cover" }}
              />
              <span className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 animate-pulse rounded-full bg-orange shadow-[0_0_16px_var(--orange)]"
                />
                <span className="font-body text-caption uppercase tracking-[0.3em] text-orange">
                  On the clock
                </span>
              </span>
              <span className="font-display text-[clamp(2.2rem,1.7rem+2.6vw,3.4rem)] uppercase leading-none tracking-tight text-bone">
                Schedule drops soon
              </span>
              <p className="max-w-[40ch] font-body text-body font-light leading-relaxed text-bone/60">
                The {AGENDA[day]?.day ?? "full"} game log tips off closer to the
                event. Check back as we lock the bracket.
              </p>
            </div>
          ) : (
          <AnimatePresence mode="wait">
            <motion.ol
              key={day}
              initial="hidden"
              animate="show"
              exit={reduced ? undefined : { opacity: 0 }}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: reduced ? 0 : 0.07 } },
              }}
            >
              {blocks.map((b, i) => (
                <motion.li
                  key={`${day}-${i}`}
                  variants={{
                    hidden: reduced ? { opacity: 1 } : { opacity: 0, y: 22 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
                  }}
                  className="group relative grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 border-t border-chalk/12 py-6 first:border-t-0 sm:gap-x-10"
                >
                  <div className="flex flex-col">
                    <span className="font-display text-[clamp(1.3rem,1.1rem+0.8vw,1.9rem)] leading-none tabular-nums text-bone">
                      {b.start}
                    </span>
                    <span className="mt-1 font-body text-caption tabular-nums text-chalk/45">
                      {b.end}
                    </span>
                  </div>

                  <div className="relative pl-8">
                    <span
                      aria-hidden
                      className="absolute left-0 top-[0.55rem] h-2.5 w-2.5 rounded-full bg-chalk/30 transition-all duration-300 group-hover:bg-orange group-hover:shadow-[0_0_16px_var(--orange)]"
                    />
                    <span
                      aria-hidden
                      className="absolute left-[0.3rem] top-5 h-[calc(100%+1.5rem)] w-px bg-chalk/12 group-last:hidden"
                    />
                    <h3 className="font-body text-lead font-medium leading-tight text-bone">
                      {b.title}
                    </h3>
                    <p className="mt-1.5 max-w-[48ch] font-body text-body font-light leading-relaxed text-bone/65">
                      {b.desc}
                    </p>
                  </div>
                </motion.li>
              ))}
            </motion.ol>
          </AnimatePresence>
          )}
        </div>
      </div>
    </section>
  );
}
