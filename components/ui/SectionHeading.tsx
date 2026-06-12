import RevealText from "@/components/ui/RevealText";
import Reveal from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  number: string;
  eyebrow: string;
  title: string;
  titleId?: string;
  kicker?: string;
  align?: "left" | "right";
  className?: string;
}

export default function SectionHeading({
  number,
  eyebrow,
  title,
  titleId,
  kicker,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "right" && "items-end text-right",
        className,
      )}
    >
      <Reveal className="flex items-center gap-4">
        <span className="font-display text-[clamp(1.1rem,0.9rem+0.6vw,1.5rem)] leading-none text-orange">
          {number}
        </span>
        <span className="h-px w-12 bg-chalk/30" />
        <span className="font-body text-caption uppercase tracking-[0.3em] text-chalk/60">
          {eyebrow}
        </span>
      </Reveal>

      <RevealText
        as="h2"
        id={titleId}
        text={title}
        className="max-w-[16ch] font-display text-title leading-[0.9] text-bone"
      />

      {kicker && (
        <Reveal delay={0.1}>
          <p className="font-body text-lead italic text-chalk/70">{kicker}</p>
        </Reveal>
      )}
    </div>
  );
}
