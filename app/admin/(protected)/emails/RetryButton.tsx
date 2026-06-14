"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { retryEmail } from "./actions";

export default function RetryButton({ emailId }: { emailId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function retry() {
    setBusy(true);
    setError(null);
    const res = await retryEmail(emailId);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={retry}
        disabled={busy}
        className="rounded-md border border-bone/20 px-2.5 py-1 text-caption text-bone/80 transition-colors hover:border-orange/40 hover:text-bone disabled:opacity-50"
      >
        {busy ? "Retrying…" : "Retry"}
      </button>
      {error ? <span className="text-caption text-danger">{error}</span> : null}
    </span>
  );
}
