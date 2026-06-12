"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import Reveal from "@/components/ui/Reveal";
import { PAST_EDITIONS, LAST_EDITION } from "@/lib/content";

export default function PastEditions() {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [constraint, setConstraint] = useState(0);

  const x = useMotionValue(0);
  const fill = useTransform(x, (v) =>
    constraint > 0 ? `${Math.max(8, Math.min(1, -v / constraint) * 100)}%` : "8%",
  );

  useEffect(() => {
    const calc = () => {
      if (!track.current || !viewport.current) return;
      setConstraint(Math.max(0, track.current.scrollWidth - viewport.current.clientWidth));
    };
    calc();
    const t = setTimeout(calc, 300);
    window.addEventListener("resize", calc);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", calc);
    };
  }, []);

  const nudge = (dir: 1 | -1) => {
    const card = track.current?.querySelector("article");
    const step = card ? card.clientWidth + 28 : 340;
    const target = Math.min(0, Math.max(-constraint, x.get() - dir * step));
    animate(x, target, { type: "spring", stiffness: 120, damping: 22 });
  };

  if (!PAST_EDITIONS.length) return null;

  return (
    <section
      id="editions"
      aria-labelledby="editions-title"
      className="relative overflow-hidden py-28 sm:py-36"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04] [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]"
        style={{ backgroundImage: "url('/tex/paper.webp')", backgroundSize: "cover" }}
      />

      <div className="mx-auto mb-12 w-full max-w-[120rem] px-6 sm:px-10 lg:mb-16">
        <div className="flex flex-col gap-3">
          <Reveal className="flex items-center gap-4">
            <span className="font-display text-[clamp(1.1rem,0.9rem+0.6vw,1.5rem)] leading-none text-orange">
              06
            </span>
            <span className="h-px w-12 bg-chalk/30" />
            <span className="font-body text-caption uppercase tracking-[0.3em] text-chalk/60">
              Last Edition · {LAST_EDITION.year}
            </span>
          </Reveal>
          <h2 id="editions-title" className="font-display text-title uppercase leading-[0.9] text-bone">
            {LAST_EDITION.name}
          </h2>
          <Reveal delay={0.1}>
            <p className="max-w-[44ch] font-body text-body font-light leading-relaxed text-bone/65">
              A look back at the floor that set the bar. Highlights from{" "}
              {LAST_EDITION.name}.
            </p>
          </Reveal>
        </div>
      </div>

      <div
        ref={viewport}
        role="group"
        aria-roledescription="carousel"
        aria-label="Past editions gallery, drag or use arrow keys"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            nudge(1);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            nudge(-1);
          }
        }}
        className="overflow-hidden rounded-3xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange"
      >
        <motion.div
          ref={track}
          drag="x"
          dragDirectionLock
          style={{ x }}
          dragConstraints={{ left: -constraint, right: 0 }}
          dragElastic={0.14}
          dragTransition={{ power: 0.3, timeConstant: 320, bounceStiffness: 200, bounceDamping: 30 }}
          className="flex w-max cursor-grab select-none gap-6 px-6 active:cursor-grabbing sm:gap-8 sm:px-10"
        >
          {PAST_EDITIONS.map((e, i) => (
            <article
              key={i}
              className="group relative aspect-[4/5] w-[82vw] shrink-0 overflow-hidden rounded-3xl border border-chalk/12 bg-surface sm:w-[clamp(320px,40vw,500px)]"
            >
              <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-blue/30 to-court" />
              <Image
                src={e.src}
                alt={e.caption}
                fill
                sizes="(max-width:640px) 82vw, 40vw"
                draggable={false}
                className="pointer-events-none object-cover object-center grayscale-[0.4] transition-all duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.05] group-hover:grayscale-0"
              />
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
                style={{ backgroundImage: "url('/tex/grain.webp')", backgroundSize: "300px" }}
              />
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-court via-court/60 to-transparent" />

              <span
                aria-hidden
                className="pointer-events-none absolute right-6 top-5 font-display text-[clamp(2.6rem,2rem+3vw,4.5rem)] leading-none tracking-tight text-transparent transition-colors duration-500 group-hover:text-orange/25"
                style={{ WebkitTextStroke: "1.5px rgba(246,248,255,0.28)" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-7">
                <p className="font-display text-[clamp(1.3rem,1rem+1vw,1.9rem)] uppercase leading-none tracking-tight text-bone">
                  {e.caption}
                </p>
                <span className="font-body text-caption uppercase tracking-[0.16em] text-orange">
                  {LAST_EDITION.name}
                </span>
              </div>
            </article>
          ))}
        </motion.div>
      </div>

      <div className="mx-auto mt-10 flex w-full max-w-[120rem] items-center gap-5 px-6 sm:px-10">
        <div className="relative h-px flex-1 overflow-hidden bg-chalk/15">
          <motion.div className="absolute inset-y-0 left-0 bg-orange" style={{ width: fill }} />
        </div>
        <span className="font-body text-caption uppercase tracking-[0.25em] text-chalk/45">
          Drag to explore
        </span>
      </div>
    </section>
  );
}
