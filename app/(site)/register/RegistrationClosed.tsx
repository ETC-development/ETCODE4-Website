import Link from "next/link";
import { EVENT } from "@/lib/content";
import type { RegistrationStatus } from "@/lib/registration";

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Africa/Algiers",
});

export default function RegistrationClosed({
  status,
}: {
  status: RegistrationStatus;
}) {
  const deadline = dateFmt.format(new Date(status.deadlineISO));
  const blurb =
    status.closedReason === "deadline"
      ? `Registration closed on ${deadline}.`
      : "Registration is closed for now.";

  return (
    <div className="mx-auto max-w-xl text-center">
      <p className="font-body text-caption uppercase tracking-[0.3em] text-orange">
        {EVENT.name} · Registration
      </p>
      <h1 className="mt-4 font-display text-[clamp(2.6rem,1.8rem+4vw,5rem)] uppercase leading-[0.9] tracking-tight text-bone">
        The roster is locked
      </h1>
      <p className="mt-5 font-body text-lead font-light leading-relaxed text-bone/75">
        {blurb} Follow ETC for news on the next tip-off. And if you&apos;re
        already registered, you can still check your team&apos;s status.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/status"
          className="rounded-full bg-orange px-6 py-3 font-body text-caption font-semibold uppercase tracking-[0.16em] text-court transition-opacity hover:opacity-90"
        >
          Check team status
        </Link>
        <Link
          href="/"
          className="rounded-full border border-chalk/20 px-6 py-3 font-body text-caption font-semibold uppercase tracking-[0.16em] text-bone/80 transition-colors hover:border-orange/40 hover:text-bone"
        >
          Back to site
        </Link>
      </div>
    </div>
  );
}
