type IconProps = { className?: string };

export function ArrowIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LinkedInIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.7h.05c.53-1 1.83-2.05 3.76-2.05 4.02 0 4.76 2.65 4.76 6.1V21h-4v-5.4c0-1.3-.02-2.95-1.8-2.95-1.8 0-2.07 1.4-2.07 2.86V21H9V9Z" />
    </svg>
  );
}

export function TikTokIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M16.5 3c.32 2.1 1.5 3.58 3.5 3.86v2.43c-1.28 0-2.5-.38-3.5-1.08v5.49A5.65 5.65 0 1 1 10.9 8.1c.3 0 .6.02.9.07v2.52a3.13 3.13 0 1 0 2.2 2.99V3h2.5Z" />
    </svg>
  );
}

export function DiscordIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.5 5.3A16 16 0 0 0 15.5 4l-.25.45a13.6 13.6 0 0 1 3.6 1.8 13 13 0 0 0-9.7 0 13.6 13.6 0 0 1 3.6-1.8L12.5 4a16 16 0 0 0-4 1.3C5.4 8.7 4.7 12 4.9 15.3A16 16 0 0 0 9 17l.65-1.05c-.52-.2-1-.45-1.47-.75l.36-.27a9 9 0 0 0 7.92 0l.36.27c-.46.3-.95.55-1.47.75L16 17a16 16 0 0 0 4.1-1.7c.3-3.85-.55-7.15-2.6-10ZM9.5 13.6c-.8 0-1.45-.72-1.45-1.6s.64-1.6 1.45-1.6 1.46.72 1.45 1.6c0 .88-.65 1.6-1.45 1.6Zm5 0c-.8 0-1.45-.72-1.45-1.6s.64-1.6 1.45-1.6 1.46.72 1.45 1.6c0 .88-.64 1.6-1.45 1.6Z" />
    </svg>
  );
}
