import Reveal from "@/components/ui/Reveal";
import { PRIZES } from "@/lib/content";
import { cn } from "@/lib/utils";

const PODIUM_CLASS = ["md:order-2", "md:order-1", "md:order-3"];

export default function Prizes() {
  if (!PRIZES.length) return null;

  return (
    <section
      id="prizes"
      aria-labelledby="prizes-title"
      className="relative overflow-hidden px-6 py-28 sm:px-10 sm:py-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05] [mask-image:radial-gradient(70%_70%_at_50%_30%,black,transparent)]"
        style={{ backgroundImage: "url('/tex/paper.webp')", backgroundSize: "cover" }}
      />
      <div className="mx-auto w-full max-w-[120rem]">
        <Reveal className="mb-14 flex flex-col items-center text-center">
          <span className="font-body text-caption uppercase tracking-[0.3em] text-chalk/60">
            Prizes
          </span>
          <h2
            id="prizes-title"
            className="mt-3 font-display text-title uppercase leading-none tracking-tight text-bone"
          >
            The Trophy
          </h2>
        </Reveal>

        <div className="mx-auto grid max-w-4xl grid-cols-1 items-end gap-5 md:grid-cols-3">
          {PRIZES.slice(0, 3).map((prize, idx) => {
            const first = idx === 0;
            return (
              <Reveal
                key={prize.place}
                delay={idx * 0.1}
                className={cn("order-none", PODIUM_CLASS[idx])}
              >
                <div
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-2xl border p-8 text-center transition-colors duration-500",
                    first
                      ? "border-orange/40 bg-orange/10 md:py-12"
                      : "border-chalk/15 bg-surface md:py-9",
                  )}
                >
                  <span
                    className={cn(
                      "font-display leading-none tracking-tight",
                      first ? "text-[clamp(3rem,2rem+4vw,5rem)] text-orange" : "text-[clamp(2.4rem,1.8rem+2.5vw,3.5rem)] text-bone",
                    )}
                  >
                    {prize.place}
                  </span>
                  <span className="font-body text-lead font-medium leading-tight text-bone">
                    {prize.reward}
                  </span>
                  {prize.note && (
                    <span className="font-body text-caption leading-relaxed text-chalk/55">
                      {prize.note}
                    </span>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
