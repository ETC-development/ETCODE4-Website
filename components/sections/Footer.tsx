import Image from "next/image";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import Marquee from "@/components/ui/Marquee";
import { InstagramIcon, LinkedInIcon, TikTokIcon, DiscordIcon } from "@/components/ui/icons";
import { EVENT, NAV_LINKS } from "@/lib/content";

const SOCIALS = [
  { label: "Instagram", href: EVENT.socials.instagram, Icon: InstagramIcon },
  { label: "LinkedIn", href: EVENT.socials.linkedin, Icon: LinkedInIcon },
  { label: "TikTok", href: EVENT.socials.tiktok, Icon: TikTokIcon },
  { label: "Discord", href: EVENT.socials.discord, Icon: DiscordIcon },
].filter((s) => s.href && !s.href.includes("TODO"));

const RIBBON = ["ETCODE 4", "Teams of 3", "ENSIA", "ETC", "Competitive Programming"];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden">
      <div className="border-t border-chalk/10 px-6 py-24 sm:px-10 sm:py-32">
        <div className="mx-auto flex max-w-[120rem] flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <p className="font-body text-caption uppercase tracking-[0.3em] text-orange">
              Final Buzzer
            </p>
            <h2 className="mt-4 max-w-[14ch] font-display text-[clamp(2.6rem,1.8rem+5vw,6rem)] uppercase leading-[0.88] tracking-tight text-bone">
              Ready to run the floor?
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="shrink-0">
            <Button href="/register" variant="solid" size="lg" magnetic={0.4}>
              Get drafted →
            </Button>
            <p className="mt-4 font-body text-caption text-chalk/55">{EVENT.tagline}</p>
          </Reveal>
        </div>
      </div>

      <Marquee items={RIBBON} speed={30} />

      <div className="mx-auto w-full max-w-[120rem] px-6 py-16 sm:px-10">
        <div className="grid grid-cols-2 gap-x-10 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
          <div className="col-span-2 flex flex-col gap-5 sm:col-span-1">
            <Image
              src="/brand/etc-white.png"
              alt={EVENT.organizer}
              width={120}
              height={155}
              className="h-16 w-auto shrink-0 self-start opacity-80"
            />
            <p className="max-w-[26ch] font-body text-caption leading-relaxed text-chalk/55">
              {EVENT.organizer}, building the competitive programming scene at
              ENSIA, Algiers.
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-col gap-3">
            <span className="mb-1 font-body text-caption uppercase tracking-[0.2em] text-chalk/40">
              The Playbook
            </span>
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="group flex w-fit items-center gap-2 font-body text-body text-bone/75 transition-colors duration-300 hover:text-orange"
              >
                <span className="h-px w-0 bg-orange transition-all duration-300 group-hover:w-4" />
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-3">
            <span className="mb-1 font-body text-caption uppercase tracking-[0.2em] text-chalk/40">
              The Court
            </span>
            <p className="max-w-[24ch] font-body text-body leading-relaxed text-bone/75">
              {EVENT.venue}
            </p>
            <a
              href={`mailto:${EVENT.contactEmail}`}
              className="w-fit font-body text-body text-bone/75 transition-colors duration-300 hover:text-orange"
            >
              {EVENT.contactEmail}
            </a>
          </div>

          <div className="flex flex-col gap-3">
            <span className="mb-1 font-body text-caption uppercase tracking-[0.2em] text-chalk/40">
              On the Wire
            </span>
            {SOCIALS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="target"
                className="group flex w-fit items-center gap-3 font-body text-body text-bone/75 transition-colors duration-300 hover:text-orange"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-chalk/15 transition-colors duration-300 group-hover:border-orange/60">
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[120rem] flex-col gap-2 border-t border-chalk/12 px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <p className="font-body text-caption text-chalk/45">
          © {new Date(EVENT.startISO).getFullYear()} {EVENT.organizer}. All rights reserved.
        </p>
        <p className="font-body text-caption uppercase tracking-[0.2em] text-chalk/40">
          Empowered by innovation
        </p>
      </div>

      <div className="relative flex select-none justify-center overflow-hidden px-4 pb-5 sm:pb-8" aria-hidden>
        <h2 className="whitespace-nowrap font-display text-[clamp(4rem,19vw,20rem)] leading-[0.92] tracking-tight text-bone/90">
          ETC<span className="text-orange">O</span>DE&nbsp;4
        </h2>
      </div>
    </footer>
  );
}
