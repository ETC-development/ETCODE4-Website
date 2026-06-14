import type { Metadata, Viewport } from "next";
import { machine, montserrat } from "./fonts";
import "./globals.css";
import { EVENT } from "@/lib/content";

const title = `${EVENT.name} · ${EVENT.organizer}`;
const description =
  "Annual competitive programming contest by ENSIA Tech Community. Teams of three. One court. No timeouts.";

export const metadata: Metadata = {
  metadataBase: new URL("https://etcode4.vercel.app"),
  title: {
    default: title,
    template: `%s · ${EVENT.name}`,
  },
  description,
  applicationName: EVENT.name,
  keywords: [
    "ETCODE 4",
    "ENSIA",
    "ETCODE",
    "ETC",
    "ENSIA Tech Community",
    "competitive programming",
    "ICPC",
    "Algeria",
    "Algiers",
    "coding contest",
  ],
  authors: [{ name: EVENT.organizer }],
  openGraph: {
    type: "website",
    title,
    description,
    siteName: EVENT.name,
    images: [{ url: "/og/og.jpg", width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og/og.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#181d2d",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${machine.variable} ${montserrat.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-court text-bone" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
