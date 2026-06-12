"use client";

import { useEffect, useRef, useState } from "react";
import SectionHeading from "@/components/ui/SectionHeading";
import MentorCard from "@/components/ui/MentorCard";
import { ArrowIcon } from "@/components/ui/icons";
import { MENTORS } from "@/lib/content";
import { cn } from "@/lib/utils";

export default function Mentors() {
  const track = useRef<HTMLUListElement>(null);
  const [bounds, setBounds] = useState({ atStart: true, atEnd: false });

  const updateBounds = () => {
    const el = track.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setBounds({
      atStart: scrollLeft <= 1,
      atEnd: scrollLeft + clientWidth >= scrollWidth - 1,
    });
  };

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    updateBounds();
    el.addEventListener("scroll", updateBounds, { passive: true });
    window.addEventListener("resize", updateBounds);
    return () => {
      el.removeEventListener("scroll", updateBounds);
      window.removeEventListener("resize", updateBounds);
    };
  }, []);

  const scrollByCards = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector("li");
    const step = card ? card.clientWidth + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  const arrowBtn =
    "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-chalk/25 text-chalk transition-colors duration-300 hover:border-orange hover:text-orange disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-chalk/25 disabled:hover:text-chalk";

  return (
    <section
      id="mentors"
      aria-labelledby="mentors-title"
      className="relative overflow-hidden px-6 py-28 sm:px-10 sm:py-36"
    >
      <div className="mx-auto w-full max-w-[120rem]">
        <SectionHeading
          number="05"
          eyebrow="Lineup"
          title="The Lineup"
          titleId="mentors-title"
          className="mb-12 lg:mb-16"
        />

        {MENTORS.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-chalk/20 px-8 py-16 text-center">
            <span className="font-display text-[2.5rem] leading-none text-chalk/30">TBA</span>
            <p className="max-w-[36ch] font-body text-body text-bone/60">
              The lineup is being finalized. Problem-setters and coaches drop here soon.
            </p>
          </div>
        ) : (
        <div className="flex items-center gap-3 sm:gap-5">
          <button
            type="button"
            onClick={() => scrollByCards(-1)}
            disabled={bounds.atStart}
            aria-label="Previous mentors"
            data-cursor="target"
            className={cn(arrowBtn, "hidden sm:flex")}
          >
            <ArrowIcon className="h-5 w-5 rotate-180" />
          </button>

          <ul
            ref={track}
            className="flex flex-1 snap-x snap-mandatory gap-5 overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {MENTORS.map((m) => (
              <li
                key={m.name}
                className="w-[72vw] shrink-0 snap-start sm:w-[260px] lg:w-[clamp(240px,20vw,300px)]"
              >
                <MentorCard {...m} />
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => scrollByCards(1)}
            disabled={bounds.atEnd}
            aria-label="Next mentors"
            data-cursor="target"
            className={cn(arrowBtn, "hidden sm:flex")}
          >
            <ArrowIcon className="h-5 w-5" />
          </button>
        </div>
        )}

        {MENTORS.length > 0 && (
          <p className="mt-6 font-body text-caption text-chalk/45 sm:hidden">
            Swipe to see the full lineup →
          </p>
        )}
      </div>
    </section>
  );
}
