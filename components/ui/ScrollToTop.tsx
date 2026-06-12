"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export default function ScrollToTop() {
  const [show, setShow] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.9);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.a
          href="#top"
          aria-label="Back to top"
          data-cursor="target"
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
          transition={{ duration: reduced ? 0.15 : 0.4, ease: [0.16, 1, 0.3, 1] }}
          whileHover={reduced ? undefined : { y: -4 }}
          className="group fixed bottom-6 right-6 z-40 flex h-[52px] w-[52px] items-center justify-center rounded-full border border-chalk/30 bg-court/30 backdrop-blur-md transition-colors duration-300 hover:border-orange sm:bottom-8 sm:right-8"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6 text-chalk transition-colors duration-300 group-hover:text-orange"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 19V5M6 11l6-6 6 6" />
          </svg>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
