import Reveal from "@/components/ui/Reveal";
import { SPONSORS } from "@/lib/content";

export default function Sponsors() {
  if (!SPONSORS.length) return null;

  return (
    <section
      aria-label="Sponsors and partners"
      className="relative overflow-hidden border-t border-chalk/10 px-6 py-20 sm:px-10"
    >
      <div className="mx-auto w-full max-w-[120rem]">
        <Reveal className="mb-10 text-center">
          <span className="font-body text-caption uppercase tracking-[0.3em] text-chalk/50">
            Backed by
          </span>
        </Reveal>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-chalk/10 bg-chalk/10 sm:grid-cols-3 lg:grid-cols-6">
          {SPONSORS.map((s, i) => (
            <Reveal key={s.name} delay={(i % 6) * 0.05}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="target"
                className="group flex h-28 items-center justify-center bg-court px-4 transition-colors duration-500 hover:bg-surface"
              >
                <span className="font-display text-[1.3rem] uppercase tracking-tight text-chalk/35 transition-colors duration-500 group-hover:text-bone">
                  {s.name}
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
