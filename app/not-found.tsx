import Image from "next/image";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 opacity-[0.05]">
        <Image src="/court/halfcourt.webp" alt="" fill sizes="100vw" className="object-cover" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.08] mix-blend-screen [mask-image:radial-gradient(60%_60%_at_50%_45%,black,transparent)]"
        style={{ backgroundImage: "url('/tex/scratch.webp')", backgroundSize: "cover" }}
      />

      <span
        aria-hidden
        className="pointer-events-none select-none font-display text-[clamp(8rem,8rem+18vw,26rem)] leading-none tracking-tight text-transparent [-webkit-text-stroke:1.5px_rgba(205,212,224,0.18)]"
        style={{ WebkitTextStroke: "1.5px rgba(205,212,224,0.18)" }}
      >
        4<span className="[-webkit-text-stroke:1.5px_rgba(221,119,45,0.6)]" style={{ WebkitTextStroke: "1.5px rgba(221,119,45,0.6)" }}>0</span>4
      </span>

      <div className="-mt-6 sm:-mt-10">
        <p className="font-body text-caption uppercase tracking-[0.32em] text-orange">
          Whistle blown
        </p>
        <h1 className="mt-3 font-display text-[clamp(2.4rem,1.8rem+3vw,4rem)] uppercase leading-none tracking-tight text-bone">
          Out of bounds
        </h1>
        <p className="mx-auto mt-4 max-w-[44ch] font-body text-body font-light leading-relaxed text-bone/70">
          That play went off the court. The page you&apos;re looking for isn&apos;t
          on the roster. Let&apos;s get you back in the game.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Button href="/" variant="solid" magnetic={0.3}>
            Back to the court →
          </Button>
          <Link
            href="/register"
            className="font-body text-caption uppercase tracking-[0.18em] text-chalk/60 transition-colors hover:text-bone"
          >
            Register
          </Link>
        </div>
      </div>
    </main>
  );
}
