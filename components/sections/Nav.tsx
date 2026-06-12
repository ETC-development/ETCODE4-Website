"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const LINKS = [
  { label: "About", href: "#about" },
  { label: "Format", href: "#format" },
  { label: "Agenda", href: "#agenda" },
  { label: "Lineup", href: "#mentors" },
  { label: "FAQ", href: "#faq" },
] as const;

const EASE = [0.16, 1, 0.3, 1] as const;

export default function Nav() {
  const reduced = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = LINKS.map((l) => l.href.slice(1));
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
        scrolled
          ? "border-b border-chalk/10 bg-court/80 backdrop-blur-md"
          : "border-b border-transparent",
      )}
    >
      <nav className="mx-auto flex max-w-[120rem] items-center justify-between px-6 py-4 sm:px-10">
        <Link
          href="/"
          aria-label="ETCODE 4 home"
          className="relative z-[60] inline-flex items-center transition-opacity duration-300 hover:opacity-80"
        >
          <Image
            src="/brand/etcode-white-mark.svg"
            alt="ETCODE 4"
            width={150}
            height={44}
            priority
            className={cn(
              "h-7 w-auto transition-transform duration-500 sm:h-8",
              open && "scale-95",
            )}
          />
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {LINKS.map((l) => {
            const isActive = active === l.href.slice(1);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "group relative font-body text-caption uppercase tracking-[0.18em] transition-colors duration-300 hover:text-bone",
                  isActive ? "text-bone" : "text-bone/70",
                )}
              >
                {l.label}
                <span
                  className={cn(
                    "absolute -bottom-1.5 left-0 h-px w-full origin-left bg-orange transition-transform duration-400 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-x-100",
                    isActive ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <Button href="/register" variant="outline" size="md" magnetic={0.25}>
              Register
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="relative z-[60] flex h-10 w-10 flex-col items-center justify-center gap-[5px] lg:hidden"
          >
            <span
              className={cn(
                "h-px w-6 bg-bone transition-all duration-400 ease-[cubic-bezier(.87,0,.13,1)]",
                open && "translate-y-[3px] rotate-45",
              )}
            />
            <span
              className={cn(
                "h-px w-6 bg-bone transition-all duration-400 ease-[cubic-bezier(.87,0,.13,1)]",
                open && "-translate-y-[3px] -rotate-45",
              )}
            />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
            exit={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.6, ease: EASE }}
            className="fixed inset-0 z-40 flex flex-col justify-center gap-2 bg-court px-8 lg:hidden"
          >
            {LINKS.map((l, i) => (
              <motion.div
                key={l.href}
                initial={{ y: reduced ? 0 : "110%" }}
                animate={{ y: "0%" }}
                exit={{ y: 0 }}
                transition={{ duration: 0.6, ease: EASE, delay: 0.1 + i * 0.07 }}
                className="overflow-hidden"
              >
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block font-display text-[clamp(2.8rem,12vw,4.5rem)] uppercase leading-none tracking-tight text-bone transition-colors hover:text-orange"
                >
                  {l.label}
                </Link>
              </motion.div>
            ))}
            <div className="mt-10">
              <Button href="/register" variant="solid" size="lg" onClick={() => setOpen(false)}>
                Get drafted →
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
