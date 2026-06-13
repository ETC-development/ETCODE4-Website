import Reveal from "@/components/ui/Reveal";
import { SPONSORS } from "@/lib/content";

export default function Sponsors() {
  if (!SPONSORS.length) return null;

  const sponsor = SPONSORS[0];

  return (
    <section
      aria-label="Sponsors and partners"
      className="relative overflow-hidden border-t border-chalk/10 px-6 py-28 sm:px-10 sm:py-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05] [mask-image:radial-gradient(70%_70%_at_50%_40%,black,transparent)]"
        style={{ backgroundImage: "url('/tex/paper.webp')", backgroundSize: "cover" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange/15 blur-[120px]"
      />

      <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        <Reveal className="flex flex-col items-center">
          <span className="font-body text-caption uppercase tracking-[0.3em] text-chalk/60">
            Backed by
          </span>
          <h2 className="mt-3 font-display text-title uppercase leading-none tracking-tight text-bone">
            Our Partner
          </h2>
        </Reveal>

        <Reveal delay={0.12} className="mt-12 w-full">
          <a
            href={sponsor.url}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="target"
            className="group relative mx-auto flex max-w-xl flex-col items-center gap-6 overflow-hidden rounded-3xl border border-chalk/15 bg-surface/60 px-10 py-16 backdrop-blur-sm transition-colors duration-500 hover:border-orange/40 sm:px-16"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-b from-orange/0 via-orange/0 to-orange/10 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            />

            <span className="font-body text-caption uppercase tracking-[0.35em] text-chalk/45">
              Official Partner
            </span>

            <span className="font-display text-[clamp(2.6rem,1.8rem+4vw,4.5rem)] uppercase leading-none tracking-tight text-bone transition-colors duration-500">
              {sponsor.name}
            </span>

            <span className="flex items-center gap-2 font-body text-caption uppercase tracking-[0.25em] text-chalk/45 transition-colors duration-500 group-hover:text-orange">
              Visit site
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
