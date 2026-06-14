export const EVENT = {
  name: "ETCODE 4",
  organizer: "ENSIA Tech Community",
  tagline: "Three coders. One court. No timeouts.",
  startISO: "2026-06-21T15:30:00+01:00",
  endISO: "2026-06-22T18:15:00+01:00",
  venue: "ENSIA School, Sidi Abdellah, Algiers",
  registrationDeadlineISO: "2026-06-19T15:00:00+01:00",
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
  "ETCODE 4 is the fourth tip-off of ENSIA Tech Community's flagship competitive programming contest, teams of three, one clock. Algorithms are the playbook; the only currency on the floor is a correct submission before the buzzer. Bring three minds, read the defense, and run the fastest offense in the league.";

export const STATS: { value: string; label: string }[] = [
  { value: "4th", label: "Edition" },
  { value: "20", label: "Teams on the floor" },
  { value: "16", label: "Problems on the board" },
  { value: "4", label: "Phases" },
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
    desc: "Ten problems, three phases. Call the right plays: who attacks which problem, when to pivot, when to take the open shot instead of forcing the hard one.",
  },
  {
    tag: "03",
    title: "Teamwork",
    desc: "The win goes to the squad that passes the ball, splitting the board, reviewing each other's code, and trusting the assist.",
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
      { start: "14:00", end: "15:00", title: "Check-in", desc: "Teams arrive, seats assigned." },
      { start: "15:00", end: "16:30", title: "Opening Ceremony", desc: "Welcome, rules walkthrough, and the practice problem on the big screen." },
      { start: "16:30", end: "17:30", title: "Coffee Break", desc: "" },
      { start: "17:30", end: "18:30", title: "Training Camp (Phase1)", desc: "Easy problems." },
      { start: "18:30", end: "19:30", title: "Playoff Push", desc: "" },
      { start: "19:30", end: "20:30", title: "Dinner", desc: "" },
      { start: "20:30", end: "22:00", title: "Regular Session (Phase2)", desc: "Intermediate problems." },
      { start: "22:00", end: "00:00", title: "Fun Activities", desc: "Open to everyone." },
      { start: "00:00", end: "02:00", title: "Play-offs Push", desc: "Overtime." },
    ],
  },
  {
    day: "Final Day",
    date: "Sun · 22 Jun",
    blocks: [
      { start: "08:00", end: "09:00", title: "Breakfast Service", desc: "" },
      { start: "09:30", end: "11:30", title: "Phase 3", desc: "Hard problems." },
      { start: "12:00", end: "13:00", title: "Launch Break", desc: "" },
      { start: "13:30", end: "14:30", title: "Final Phase", desc: "" },
      { start: "15:00", end: "16:00", title: "Coffee Break", desc: "" },
      { start: "16:00", end: "17:00", title: "Closing Ceremony", desc: "" },
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
  { name: "Abdelkhalek BENKINIOUAR", role: "Head Judge", year: "4th Year · ETC Dev Co-Manager", photo: "/mentors/kenny.jpg", linkedin: "https://www.linkedin.com/in/abdelkhalek-benkiniouar-921137325/", number: "01" },
  { name: "Abdelhak KADOUCI", role: "Problem Setter", year: "3rd Year · ETCODE3 Winner", photo: "/mentors/kadouci.jpeg", linkedin: "https://www.linkedin.com/in/abdelhak-kadouci", number: "08" },
  { name: "Mohammed Abdullah HAMMADI", role: "Problem Setter", year: "3rd Year · ETCODE3 Winner", photo: "/mentors/hamadi.jpg", linkedin: "https://www.linkedin.com/in/mohammed-hamadi-697668252/", number: "10" },
  { name: "Khaled ZAABAT", role: "Problem Setter", year: "3rd Year · ETCODE3 Winner", photo: "/mentors/khaled.jpg", linkedin: "https://www.linkedin.com/in/khaled-zaabat-a57b4a299/", number: "11" },
  { name: "Moulay BOUABDELLI", role: "Problem Setter", year: "4th Year · ETC Dev Co-Manaer", photo: "/mentors/moulay.png", linkedin: "https://www.linkedin.com/in/moulay-mohamed-bouabdelli-842151325/", number: "14" },
  { name: "Mohammed FERHAOUI", role: "Problem Setter", year: "4th Year · ETC Web Dev Manager", photo: "/mentors/frix.jpeg", linkedin: "https://www.linkedin.com/in/mohamed-frihaoui-654b89300/", number: "07" },
  { name: "Zyad KHERRAF", role: "Problem Setter", year: "4th Year", photo: "/mentors/zyad.jpeg", linkedin: "https://www.linkedin.com/in/zyad-kherraf-2222132a5/", number: "23" },
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
  { place: "1st", reward: "The Champions' Trophy", note: "Cash pool · medals" },
  { place: "2nd", reward: "Runner-Up Medals", note: "Cash pool · ETC merch pack" },
  { place: "3rd", reward: "Podium Finish", note: "Medals · ETC merch pack" },
];

export const SPONSORS: { name: string; url: string }[] = [
  { name: "Turkinvest", url: "https://www.turkinvestalgeria.com" },
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
