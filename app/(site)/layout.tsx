import SmoothScroll from "@/components/ui/SmoothScroll";
import Cursor from "@/components/ui/Cursor";
import GrainOverlay from "@/components/ui/GrainOverlay";
import ScrollProgress from "@/components/ui/ScrollProgress";

// Marketing shell — only the public site gets Lenis smooth-scroll, the custom
// cursor, the grain overlay, and the scroll-progress bar. The /admin area is
// outside this group, so it renders without any of that weight.
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-[100] focus-visible:rounded-full focus-visible:bg-orange focus-visible:px-5 focus-visible:py-2.5 focus-visible:font-body focus-visible:text-caption focus-visible:font-semibold focus-visible:uppercase focus-visible:tracking-[0.16em] focus-visible:text-court"
      >
        Skip to content
      </a>
      <ScrollProgress />
      <SmoothScroll>{children}</SmoothScroll>
      <Cursor />
      <GrainOverlay />
    </>
  );
}
