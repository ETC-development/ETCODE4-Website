"use client";

import { useEffect } from "react";

// Last-resort boundary: catches errors thrown in the ROOT layout itself, where
// app/error.tsx can't reach. It renders its own <html>/<body> and replaces the
// whole tree — so fonts/Tailwind aren't guaranteed; all styling is inline with
// the brand palette to be bulletproof.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.25rem",
          padding: "1.5rem",
          textAlign: "center",
          background: "#181d2d",
          color: "#f6f8ff",
          fontFamily:
            "Montserrat, ui-sans-serif, system-ui, -apple-system, sans-serif",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "0.75rem",
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "#dd772d",
          }}
        >
          Whistle blown
        </p>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(1.8rem, 1.4rem + 2vw, 2.8rem)",
            textTransform: "uppercase",
            lineHeight: 1.05,
          }}
        >
          Something broke on our end
        </h1>
        <p
          style={{
            margin: 0,
            maxWidth: "46ch",
            fontWeight: 300,
            lineHeight: 1.6,
            color: "rgba(246,248,255,0.7)",
          }}
        >
          That play didn&apos;t go through. Try again. If it keeps happening,
          reach the ETC team.
        </p>
        {error.digest ? (
          <p
            style={{
              margin: 0,
              fontFamily: "ui-monospace, monospace",
              fontSize: "0.75rem",
              color: "rgba(246,248,255,0.35)",
            }}
          >
            ref: {error.digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "0.5rem",
            border: "none",
            cursor: "pointer",
            borderRadius: "0.75rem",
            background: "#dd772d",
            color: "#181d2d",
            padding: "0.75rem 1.5rem",
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
