import Link from "next/link";
import { cn } from "@/lib/utils";

/** Standard admin page header: title + optional subtitle + right-aligned actions. */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <h1 className="font-display text-4xl uppercase leading-none">{title}</h1>
        {subtitle ? (
          <p className="mt-2 max-w-prose text-sm text-bone/55">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

/** The small uppercase caption heading used on every admin card/section. */
export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "font-body text-caption font-semibold uppercase tracking-[0.16em] text-bone/55",
        className,
      )}
    >
      {children}
    </h2>
  );
}

/** Surface card with an optional title + actions. One radius, one padding. */
export function Card({
  title,
  actions,
  children,
  className,
}: {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("rounded-2xl border border-bone/10 bg-surface p-5", className)}
    >
      {title ? (
        <div className="mb-4 flex items-center justify-between gap-2">
          <SectionLabel>{title}</SectionLabel>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

function buttonClass(variant: Variant, size: Size, className?: string): string {
  return cn(
    "inline-flex items-center justify-center gap-1.5 rounded-lg font-body font-semibold uppercase tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    size === "sm" ? "px-3 py-1.5 text-caption" : "px-4 py-2 text-caption",
    variant === "primary" && "bg-orange text-court hover:bg-orange/90",
    variant === "secondary" &&
      "border border-bone/20 text-bone/85 hover:border-orange/40 hover:text-bone",
    variant === "ghost" && "text-bone/65 hover:bg-surface-2 hover:text-bone",
    variant === "danger" &&
      "border border-danger/40 text-danger hover:bg-danger/10",
    className,
  );
}

/** Class-string form, for when an existing <button>/<a> needs the look. */
export function adminButton(variant: Variant = "secondary"): string {
  return buttonClass(variant, "md");
}

type BtnProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

/** Consistent admin button. */
export function Btn({
  variant = "secondary",
  size = "md",
  className,
  children,
  type = "button",
  ...rest
}: BtnProps) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

/** Link styled as a button (CSV downloads, nav actions). */
export function BtnLink({
  href,
  variant = "secondary",
  size = "md",
  className,
  children,
  ...rest
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
} & Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "className" | "children"
>) {
  const isInternal = href.startsWith("/") && !href.startsWith("//");
  const cls = buttonClass(variant, size, className);
  return isInternal && !rest.target ? (
    <Link href={href} className={cls} {...rest}>
      {children}
    </Link>
  ) : (
    <a href={href} className={cls} {...rest}>
      {children}
    </a>
  );
}

/** Dashed empty-state panel. */
export function EmptyState({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-bone/12 px-4 py-10 text-center text-sm text-bone/50",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Inline spinner (respects reduced-motion via the global media query). */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent align-[-2px]",
        className,
      )}
    />
  );
}
