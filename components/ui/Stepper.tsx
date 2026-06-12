import { cn } from "@/lib/utils";

interface StepperProps {
  steps: string[];
  current: number;
}

export default function Stepper({ steps, current }: StepperProps) {
  return (
    <ol className="flex items-center gap-3">
      {steps.map((label, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <li key={label} className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border font-display text-[0.95rem] leading-none transition-colors duration-300",
                  active
                    ? "border-orange bg-orange text-court"
                    : done
                      ? "border-orange/60 text-orange"
                      : "border-chalk/25 text-chalk/45",
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  "font-body text-caption uppercase tracking-[0.18em] transition-colors duration-300",
                  active ? "text-bone" : "text-chalk/45",
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span className={cn("h-px w-8 transition-colors duration-300", done ? "bg-orange/60" : "bg-chalk/20")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
