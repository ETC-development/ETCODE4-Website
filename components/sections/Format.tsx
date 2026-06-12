import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import { FORMAT_ROUNDS } from "@/lib/content";
import { cn } from "@/lib/utils";
import { sectionNo } from "@/lib/utils";

export default function Format() {
  return (
    <section
      id="format"
      aria-labelledby="format-title"
      className="relative overflow-hidden px-6 py-28 sm:px-10 sm:py-36"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06] [mask-image:radial-gradient(80%_70%_at_70%_30%,black,transparent)]"
      >
        <Image src="/court/tactics.webp" alt="" fill sizes="100vw" className="object-cover object-right" />
      </div>

      <div className="mx-auto w-full max-w-[120rem]">
        <SectionHeading
          number="03"
          eyebrow="Format"
          title="The Rulebook"
          titleId="format-title"
          className="mb-16 lg:mb-20"
        />

        <ol className="mx-auto max-w-4xl">
          {FORMAT_ROUNDS.map((round, i) => {
            const last = i === FORMAT_ROUNDS.length - 1;
            return (
              <li key={round.title}>
                <Reveal delay={i * 0.05} className="flex gap-6 sm:gap-10">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "flex h-14 w-14 shrink-0 items-center justify-center rounded-full border font-display text-[1.4rem] leading-none sm:h-16 sm:w-16 sm:text-[1.7rem]",
                        last
                          ? "border-orange/60 text-orange"
                          : "border-chalk/30 text-bone",
                      )}
                    >
                      {sectionNo(i + 1)}
                    </span>
                    {!last && (
                      <span className="mt-3 w-px flex-1 bg-gradient-to-b from-chalk/30 to-chalk/5" />
                    )}
                  </div>

                  <div className={cn("pb-14", last && "pb-0")}>
                    <h3 className="font-display text-[clamp(1.7rem,1.3rem+1.8vw,2.8rem)] uppercase leading-none tracking-tight text-bone">
                      {round.title}
                    </h3>
                    <p className="mt-4 max-w-[52ch] font-body text-body font-light leading-relaxed text-bone/75">
                      {round.desc}
                    </p>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
