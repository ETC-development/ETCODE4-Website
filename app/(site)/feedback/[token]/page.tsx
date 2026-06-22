import type { Metadata } from "next";
import { getForm } from "@/lib/feedback/questions";
import { lookupToken } from "@/lib/feedback/server";
import FeedbackForm from "./FeedbackForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ETCODE 4 — Feedback",
  description: "Share your feedback on ETCODE 4.",
  robots: { index: false },
};

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="w-full max-w-xl rounded-2xl border border-bone/10 bg-surface p-7 text-center">
      <p className="font-body text-caption font-semibold uppercase tracking-[0.18em] text-orange">
        ETCODE 4 · Feedback
      </p>
      <h1 className="mt-3 font-display text-title uppercase">{title}</h1>
      <p className="mt-3 text-bone/65">{body}</p>
    </div>
  );
}

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const who = await lookupToken(token);

  let content: React.ReactNode;
  if (!who.found || !who.eligible) {
    content = (
      <Notice
        title="Link not valid"
        body="This feedback link isn't valid or has expired. If you think this is a mistake, reply to the email we sent you."
      />
    );
  } else if (who.submitted) {
    content = (
      <Notice
        title="Already submitted"
        body="You've already shared your feedback — thank you. Your responses are anonymous, so there's nothing more to do."
      />
    );
  } else {
    content = (
      <FeedbackForm
        token={token}
        form={getForm(who.audience, who.role)}
        name={who.name}
      />
    );
  }

  return (
    <main id="main" className="grid min-h-dvh place-items-center px-6 py-16">
      {content}
    </main>
  );
}
