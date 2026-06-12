import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import Accordion from "@/components/ui/Accordion";
import { FAQ } from "@/lib/content";

export default function Faq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="relative overflow-hidden px-6 py-28 sm:px-10 sm:py-36"
    >
      <div className="mx-auto grid w-full max-w-[120rem] gap-x-16 gap-y-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHeading number="07" eyebrow="FAQ" title="Timeouts" titleId="faq-title" />
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-[34ch] font-body text-body font-light leading-relaxed text-bone/65">
              Call one before the clock starts. Everything you need to know before
              you step on the floor.
            </p>
          </Reveal>
        </div>

        <Reveal className="lg:col-span-7 lg:col-start-6" delay={0.1}>
          <Accordion items={FAQ} />
        </Reveal>
      </div>
    </section>
  );
}
