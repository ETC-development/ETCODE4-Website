export const EVENT = {
  name: "ETCODE 4",
  organizer: "ENSIA Tech Community",
  tagline: "Three coders. One court. No timeouts.",
  startISO: "2026-06-21T16:00:00+01:00",
  endISO: "2026-06-22T18:16:00+01:00",
  venue: "ENSIA School, Sidi Abdellah, Algiers",
  registrationDeadlineISO: "2026-04-11T23:59:00+01:00",
  teamSize: 3,
  contactEmail: "tech-community@ensia.edu.dz",
  socials: {
    instagram: "https://www.instagram.com/etc_.club",
    linkedin: "https://www.linkedin.com/company/ensia-tech-community",
    tiktok: "https://www.tiktok.com/@etc._.club",
    discord: "https://discord.gg/TqkXM9H2",
  },
} as const;

export const ABOUT =
  "ETCODE 4 is the fourth tip-off of ENSIA Tech Community's flagship competitive programming contest, ICPC-style, teams of three, one clock. Algorithms are the playbook; the only currency on the floor is a correct submission before the buzzer. Bring three minds, read the defense, and run the fastest offense in the league.";

export const STATS: { value: string; label: string }[] = [
  { value: "4th", label: "Edition" },
  { value: "X", label: "Teams on the floor" },
  { value: "X", label: "Problems on the board" },
  { value: "X", label: "Hours on the clock" },
];

export const PILLARS: { tag: string; title: string; desc: string }[] = [
  {
    tag: "01",
    title: "Speed",
    desc: "The clock never stops. The leaderboard rewards the team that turns an idea into an accepted solution first. Clean reads, fast hands, no hesitation in the paint.",
  },
  {
    tag: "02",
    title: "Strategy",
    desc: "Ten problems, one shot clock. Call the right plays: who attacks which problem, when to pivot, when to take the open shot instead of forcing the hard one.",
  },
  {
    tag: "03",
    title: "Teamwork",
    desc: "One keyboard, three coders. The win goes to the squad that passes the ball, splitting the board, reviewing each other's code, and trusting the assist.",
  },
];

export const FORMAT_ROUNDS: { title: string; desc: string }[] = [
  {
    title: "The Draft",
    desc: "Lock your roster of three and check in. Editors, languages, and the judge are set up; warm-up problems open the floor so every team gets a feel for the court.",
  },
  {
    title: "Tip-Off",
    desc: "The full problem set goes live. Teams share a single machine and attack 8-10 problems spanning ad-hoc, graphs, greedy, DP, and number theory. Difficulty climbs as the half wears on.",
  },
  {
    title: "The Press",
    desc: "Standard ICPC scoring: an accepted solution scores; every wrong submission adds a time penalty. Ties break on total time, so a clean first attempt is worth more than a rushed one.",
  },
  {
    title: "Final Buzzer",
    desc: "The scoreboard freezes in the closing minutes. No one sees the late lead change. The judges thaw it on stage, and the top of the standings takes the trophy.",
  },
];

export const AGENDA: {
  day: string;
  date: string;
  blocks: { start: string; end: string; title: string; desc: string }[];
}[] = [
  {
    day: "Game Day",
    date: "Sat · 21 Jun",
    blocks: [
      { start: "15:00", end: "16:00", title: "Check-in & Draft", desc: "Teams arrive, seats assigned, machines and the judge verified." },
      { start: "16:00", end: "16:30", title: "Opening Tip", desc: "Welcome, rules walkthrough, and the practice problem on the big screen." },
      { start: "16:30", end: "17:00", title: "Warm-Up Round", desc: "A short unranked round to test the judge and shake off the nerves." },
      { start: "17:00", end: "22:00", title: "Main Contest", desc: "Five hours on the clock. The full problem set, one machine per team." },
      { start: "22:00", end: "22:30", title: "Scoreboard Freeze", desc: "Standings lock. The closing sprint plays out in the dark." },
    ],
  },
  {
    day: "Awards",
    date: "Sun · 22 Jun",
    blocks: [
      { start: "10:00", end: "11:00", title: "Editorial", desc: "Problem setters walk through the intended solutions and the trickiest tests." },
      { start: "11:00", end: "12:00", title: "Unfreeze & Podium", desc: "The scoreboard thaws live; the top teams take the floor for the trophy." },
      { start: "12:00", end: "13:00", title: "Closing & Photos", desc: "Sponsor word, group photo, and the after-game handshake line." },
    ],
  },
];

export const MENTORS: {
  name: string;
  role: string;
  year: string;
  photo: string;
  linkedin: string;
  number: string;
}[] = [
  { name: "Abdelkhalek BENKINIOUAR", role: "Head Judge", year: "Alumnus · ICPC Finalist", photo: "/brand/pfp.png", linkedin: "#", number: "01" },
  { name: "Abdelhak KADOUCI", role: "Lead Problem Setter", year: "4th Year · AI", photo: "/brand/pfp.png", linkedin: "#", number: "07" },
  { name: "Mohammed Abdullah HAMMADI", role: "Problem Setter", year: "3rd Year · Data Science", photo: "/brand/pfp.png", linkedin: "#", number: "11" },
  { name: "Amani Boudjelal", role: "Contest Coach", year: "Alumna · SWE @ Scale", photo: "/brand/pfp.png", linkedin: "#", number: "23" },
  { name: "Ryad Ouali", role: "Technical Lead", year: "4th Year · Systems", photo: "/brand/pfp.png", linkedin: "#", number: "08" },
  { name: "Sara Mansouri", role: "Problem Setter", year: "3rd Year · Algorithms", photo: "/brand/pfp.png", linkedin: "#", number: "14" },
];

export const FAQ: { q: string; a: string }[] = [
  {
    q: "Who can play?",
    a: "Any student passionate about problem-solving, from first-years to final-years, on-campus or visiting. You don't need to have competed before; you need three people ready to think fast.",
  },
  {
    q: "Do I need a full team of three?",
    a: "Teams are exactly three. No squad yet? Register solo. Admins draft free agents onto teams before the contest. Complete teams of three always get priority on the floor.",
  },
  {
    q: "What can we use during the contest?",
    a: "Standard ICPC rules: your own brains, the languages we support, and offline documentation. No internet, no AI assistants, no outside communication once the clock starts.",
  },
  {
    q: "Which languages are supported?",
    a: "C++, Java, and Python on the judge. C++ is the league standard for a reason, but bring whatever your team is fastest in.",
  },
  {
    q: "How hard are the problems?",
    a: "There's a shot for everyone: the set opens with approachable ad-hoc problems and ramps up to the kind of graph and DP problems you'd see in a regional. Every team should solve something.",
  },
  {
    q: "Is there a registration fee?",
    a: "No. ETCODE 4 is free to enter. Just lock your roster before the deadline and show up ready to play.",
  },
];

export const PRIZES: { place: string; reward: string; note?: string }[] = [
  { place: "1st", reward: "The Champions' Trophy", note: "Cash pool · medals · the top spot on the wall" },
  { place: "2nd", reward: "Runner-Up Medals", note: "Cash pool · ETC merch pack" },
  { place: "3rd", reward: "Podium Finish", note: "Medals · ETC merch pack" },
];

export const SPONSORS: { name: string; url: string }[] = [
  { name: "Partner One", url: "#" },
  { name: "Partner Two", url: "#" },
  { name: "Partner Three", url: "#" },
  { name: "Partner Four", url: "#" },
  { name: "Partner Five", url: "#" },
  { name: "Partner Six", url: "#" },
];

export const LAST_EDITION = { name: "ETCODE 3", year: "2025" } as const;

export const PAST_EDITIONS: { src: string; caption: string }[] = [
  { src: "/editions/1.JPG", caption: "The tip-off" },
  { src: "/editions/4.JPG", caption: "The grind" },
  { src: "/editions/3.JPG", caption: "The clutch shot" },
  { src: "/editions/2.JPG", caption: "The winning moment" },
];

export const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Format", href: "#format" },
  { label: "Agenda", href: "#agenda" },
  { label: "Lineup", href: "#mentors" },
  { label: "FAQ", href: "#faq" },
] as const;
