import Image from "next/image";
import { LinkedInIcon } from "@/components/ui/icons";

interface MentorCardProps {
  name: string;
  role: string;
  year: string;
  photo: string;
  linkedin: string;
  number: string;
}

export default function MentorCard({
  name,
  role,
  year,
  photo,
  linkedin,
  number,
}: MentorCardProps) {
  return (
    <article className="group relative aspect-[3/4] h-full overflow-hidden rounded-2xl border border-chalk/12 bg-surface transition-colors duration-500 ease-[cubic-bezier(.16,1,.3,1)] hover:border-orange/40">
      <Image
        src={photo}
        alt={name}
        fill
        sizes="(max-width:640px) 72vw, 300px"
        className="object-cover object-center grayscale transition-all duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04] group-hover:grayscale-0"
      />

      <div
        aria-hidden
        className="absolute inset-0 bg-court/45 mix-blend-multiply transition-opacity duration-700 group-hover:opacity-20"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-court via-court/85 to-transparent"
      />

      <span
        aria-hidden
        className="pointer-events-none absolute -right-1 bottom-20 font-display text-[7rem] leading-none text-orange/0 transition-all duration-500 group-hover:text-orange/20 sm:text-[9rem]"
      >
        {number}
      </span>

      <a
        href={linkedin}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${name} on LinkedIn`}
        data-cursor="target"
        className="absolute right-3 top-3 flex h-10 w-10 -translate-y-[140%] items-center justify-center rounded-full border border-chalk/30 bg-court/70 text-chalk opacity-0 backdrop-blur-sm transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)] hover:border-orange hover:text-orange group-hover:translate-y-0 group-hover:opacity-100"
      >
        <LinkedInIcon className="h-4 w-4" />
      </a>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-5">
        <span className="font-display text-[0.9rem] leading-none text-chalk/45 transition-colors duration-500 group-hover:text-orange">
          #{number}
        </span>
        <h3 className="font-display text-[clamp(1.25rem,1.05rem+0.7vw,1.6rem)] uppercase leading-none tracking-tight text-bone">
          {name}
        </h3>
        <p className="mt-1 font-body text-caption font-medium uppercase tracking-[0.14em] text-bone/85">
          {role}
        </p>
        <p className="font-body text-caption text-chalk/55">{year}</p>
      </div>
    </article>
  );
}
