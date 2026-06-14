/**
 * Official ETCODE 4 team codenames: the contest's roster of names. Exactly one
 * is assigned per accepted team (admins pick on the team detail page), and the
 * assigned name is then used in the acceptance email, the public /status page,
 * and the live board. Teams fall back to their self-chosen registration name
 * until an official name is assigned.
 */
export const TEAM_NAMES: readonly string[] = [
  // "Court Vision",
  // "Fast Break",
  // "Full Court Press",
  // …add the 20 official ETCODE 4 team names here
];

/** Whether a candidate name belongs to the official pool (exact match). */
export function isOfficialTeamName(name: string): boolean {
  return TEAM_NAMES.includes(name);
}

/**
 * The pool annotated with availability for an assignment UI. `taken` reflects
 * names already given to *other* teams; the team's own current name stays
 * selectable so it renders as the active option.
 */
export function teamNameOptions(
  takenByOthers: Iterable<string>,
): { name: string; taken: boolean }[] {
  const taken = new Set(takenByOthers);
  return TEAM_NAMES.map((name) => ({ name, taken: taken.has(name) }));
}
