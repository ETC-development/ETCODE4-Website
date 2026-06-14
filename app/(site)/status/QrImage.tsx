"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

// Renders a member's check-in QR entirely client-side from their opaque token
// (no PII in the code, no third-party service).
export default function QrImage({
  token,
  caption,
}: {
  token: string;
  caption: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(token, {
      margin: 1,
      width: 320,
      errorCorrectionLevel: "M",
      color: { dark: "#181d2dff", light: "#f6f8ffff" },
    })
      .then((url) => {
        if (alive) setSrc(url);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [token]);

  return (
    <figure className="flex flex-col items-center gap-2">
      <div className="rounded-xl bg-bone p-2">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={`Check-in QR for ${caption}`}
            width={160}
            height={160}
            className="size-40"
          />
        ) : (
          <div className="size-40 animate-pulse rounded bg-court/10" />
        )}
      </div>
      <figcaption className="text-caption font-medium text-bone/80">
        {caption}
      </figcaption>
    </figure>
  );
}
