import type { Metadata } from "next";
import StatusLookup from "./StatusLookup";

export const metadata: Metadata = {
  title: "Team status",
  description: "Check your ETCODE 4 team status and check-in QR codes.",
  robots: { index: false }, // utility page, keep it out of search
};

export default async function StatusPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  return (
    <main
      id="main"
      className="grid min-h-dvh place-items-center px-6 py-16"
    >
      <StatusLookup initialCode={code ?? ""} />
    </main>
  );
}
