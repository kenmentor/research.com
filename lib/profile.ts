/** A profile counts as onboarded once identity + affiliation exist. */
export function profileComplete(profile: {
  displayName?: string;
  headline?: string;
  affiliation?: string;
}): boolean {
  return Boolean(profile.displayName && profile.headline && profile.affiliation);
}

const COMPLETENESS_CHECKS: Array<{
  key: string;
  label: string;
  filled: (p: Record<string, unknown>) => boolean;
}> = [
  { key: "headline", label: "Add a headline", filled: (p) => Boolean(p.headline) },
  { key: "affiliation", label: "Add your institution", filled: (p) => Boolean(p.affiliation) },
  { key: "location", label: "Add a location", filled: (p) => Boolean(p.location) },
  { key: "bio", label: "Write your bio", filled: (p) => Boolean(p.bio) },
  {
    key: "interests",
    label: "Add research interests",
    filled: (p) => Array.isArray(p.interests) && p.interests.length > 0,
  },
  {
    key: "experience",
    label: "Add experience",
    filled: (p) => Array.isArray(p.experience) && p.experience.length > 0,
  },
  {
    key: "education",
    label: "Add education",
    filled: (p) => Array.isArray(p.education) && p.education.length > 0,
  },
  {
    key: "grants",
    label: "Add grants or awards",
    filled: (p) => Array.isArray(p.grants) && p.grants.length > 0,
  },
];

/** Owner-facing completeness: percentage + missing-item prompts. */
export function computeCompleteness(profile: Record<string, unknown>): {
  pct: number;
  missing: string[];
} {
  const missing = COMPLETENESS_CHECKS.filter((c) => !c.filled(profile)).map(
    (c) => c.label,
  );
  const pct = Math.round(
    ((COMPLETENESS_CHECKS.length - missing.length) / COMPLETENESS_CHECKS.length) * 100,
  );
  return { pct, missing };
}

export function initialsOf(displayName: string): string {
  return displayName
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
