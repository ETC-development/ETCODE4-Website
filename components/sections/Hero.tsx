"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import Button from "@/components/ui/Button";
import ShotClock from "@/components/ui/ShotClock";
import { EVENT } from "@/lib/content";

const EASE = [0.16, 1, 0.3, 1] as const;
const LETTERS = ["E", "T", "C", "O", "D", "E"] as const;

export default function Hero() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const playerY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const courtY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const sprX = useSpring(pointerX, { stiffness: 90, damping: 22, mass: 0.6 });
  const sprY = useSpring(pointerY, { stiffness: 90, damping: 22, mass: 0.6 });
  const playerTX = useTransform(sprX, [-1, 1], [36, -36]);
  const playerTY = useTransform(sprY, [-1, 1], [24, -24]);
  const playerRotY = useTransform(sprX, [-1, 1], [-12, 12]);
  const playerRotX = useTransform(sprY, [-1, 1], [8, -8]);
  const glowTX = useTransform(sprX, [-1, 1], [50, -50]);
  const glowTY = useTransform(sprY, [-1, 1], [40, -40]);

  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      pointerX.set((e.clientX / window.innerWidth - 0.5) * 2);
      pointerY.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced, pointerX, pointerY]);

  const letterIn = (i: number) => ({
    initial: reduced ? { y: "0%" } : { y: "118%" },
    animate: { y: "0%" },
    transition: { duration: 0.8, ease: EASE, delay: 0.2 + i * 0.07 },
  });

  return (
    <section
      ref={ref}
      id="top"
      aria-label="ETCODE 4, the tip-off"
      className="relative flex min-h-dvh flex-col justify-end overflow-hidden px-6 pb-10 pt-28 sm:px-10 sm:pb-14 lg:pt-32"
    >
      <svg className="absolute h-0 w-0" aria-hidden focusable="false">
        <filter id="player-grade" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0"
          />
          <feComponentTransfer>
            <feFuncR type="table" tableValues="0.094 0.224 0.965" />
            <feFuncG type="table" tableValues="0.114 0.361 0.973" />
            <feFuncB type="table" tableValues="0.176 0.588 1.0" />
          </feComponentTransfer>
        </filter>
      </svg>

      <motion.div
        aria-hidden
        style={{ y: courtY }}
        className="pointer-events-none absolute inset-0 -z-20 opacity-[0.055]"
      >
        <Image
          src="/court/halfcourt.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </motion.div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_15%_85%,rgba(24,29,45,0.92)_0%,rgba(24,29,45,0.55)_45%,transparent_80%)]"
      />

      <motion.div
        aria-hidden
        style={{ y: reduced ? 0 : playerY, perspective: 1200 }}
        className="pointer-events-none absolute -top-10 right-[-8%] -z-10 h-[86vh] w-[64vw] max-w-[820px] sm:right-[-2%] lg:w-[50vw]"
        initial={reduced ? { opacity: 1 } : { opacity: 0, x: 70, scale: 1.03 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 1.3, ease: EASE, delay: 0.15 }}
      >
        <motion.div
          style={{ x: reduced ? 0 : glowTX, y: reduced ? 0 : glowTY }}
          className="absolute left-1/2 top-1/3 h-[46%] w-[60%] -translate-x-1/2 rounded-full bg-orange/25 blur-[90px]"
        />

        <motion.div
          style={
            reduced
              ? undefined
              : {
                  x: playerTX,
                  y: playerTY,
                  rotateX: playerRotX,
                  rotateY: playerRotY,
                }
          }
          className="relative h-full w-full [transform-style:preserve-3d] will-change-transform"
        >
          <motion.div
            animate={reduced ? undefined : { y: [0, -10, 0] }}
            transition={
              reduced
                ? undefined
                : { duration: 7, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }
            }
            className="relative h-full w-full"
            style={{
              filter:
                "url(#player-grade) drop-shadow(0 22px 45px rgba(0,0,0,0.55)) drop-shadow(0 0 60px rgba(221,119,45,0.3))",
            }}
          >
            <Image
              src="/players/dunk.webp"
              alt="A player rising for a dunk"
              fill
              priority
              sizes="(max-width: 1024px) 64vw, 50vw"
              className="object-contain object-top [mask-image:linear-gradient(to_bottom,black_78%,transparent_99%)]"
            />
          </motion.div>
        </motion.div>

        <div className="absolute bottom-[6%] left-1/2 h-10 w-[42%] -translate-x-1/2 rounded-[50%] bg-court/70 blur-2xl" />
      </motion.div>

      <div className="relative z-10 mx-auto w-full max-w-[120rem]">
        <motion.p
          initial={reduced ? { opacity: 1 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
          className="mb-5 font-body text-caption uppercase tracking-[0.34em] text-chalk/70"
        >
          {EVENT.organizer} · Edition 04
        </motion.p>

        <h1 className="font-display leading-[0.84] tracking-[-0.03em] text-bone">
          <span className="flex items-center text-[clamp(4rem,3rem+13vw,15rem)]">
            {LETTERS.map((ch, i) =>
              ch === "O" ? (
                <Ball key={i} reduced={!!reduced} delay={0.2 + LETTERS.length * 0.07} />
              ) : (
                <span key={i} className="inline-flex overflow-hidden">
                  <motion.span {...letterIn(i)} className="inline-block will-change-transform">
                    {ch}
                  </motion.span>
                </span>
              ),
            )}
          </span>
        </h1>

        <div className="mt-2 flex flex-wrap items-end gap-x-8 gap-y-4 sm:mt-4">
          <motion.span
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.75 }}
            className="font-display text-[clamp(4rem,3rem+13vw,15rem)] leading-[0.8] tracking-tight text-transparent [-webkit-text-stroke:2px_var(--chalk)]"
            style={{ WebkitTextStroke: "2px var(--chalk)" }}
          >
            4
          </motion.span>

          <motion.p
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.95 }}
            className="mb-3 max-w-sm font-body text-[0.78rem] uppercase leading-relaxed tracking-[0.22em] text-bone/75 sm:text-caption"
          >
            ICPC-style · Teams of {EVENT.teamSize} · {EVENT.venue}
          </motion.p>
        </div>

        <motion.div
          initial={reduced ? { opacity: 1 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 1.0 }}
          className="mt-12 flex flex-col gap-8 border-t border-chalk/10 pt-8 sm:mt-16 sm:flex-row sm:items-end sm:justify-between"
        >
          <ShotClock targetISO={EVENT.startISO} label="Tip-off in" />
          <div className="flex flex-col items-start gap-3">
            <Button href="/register" variant="solid" size="lg" magnetic={0.4}>
              Get drafted →
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Ball({ reduced, delay }: { reduced: boolean; delay: number }) {
  return (
    <span className="relative inline-block" style={{ width: "0.74em", height: "0.74em", margin: "0 0.02em" }}>
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 -z-10 h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange/25 blur-2xl"
      />
      <motion.span
        initial={reduced ? { y: 0, scale: 1, opacity: 1 } : { y: "-90%", scale: 0.5, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={
          reduced
            ? { duration: 0 }
            : { delay, type: "spring", stiffness: 520, damping: 14, mass: 0.8 }
        }
        className="block h-full w-full will-change-transform"
      >
        <motion.span
          animate={reduced ? undefined : { y: [0, "-6%", 0] }}
          transition={
            reduced
              ? undefined
              : { duration: 6, repeat: Infinity, ease: [0.45, 0, 0.55, 1], delay: delay + 0.6 }
          }
          className="relative block h-full w-full rounded-full bg-orange"
          style={{
            backgroundImage:
              "radial-gradient(70% 60% at 35% 30%, rgba(255,255,255,0.35), transparent 60%)",
          }}
        >
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
            <path d="M50 4 V96" stroke="rgba(24,29,45,0.45)" strokeWidth="3" fill="none" />
            <path
              d="M12 24 Q50 50 12 76"
              stroke="rgba(24,29,45,0.30)"
              strokeWidth="2.5"
              fill="none"
            />
            <path
              d="M88 24 Q50 50 88 76"
              stroke="rgba(24,29,45,0.30)"
              strokeWidth="2.5"
              fill="none"
            />
          </svg>
        </motion.span>
      </motion.span>
    </span>
  );
}
