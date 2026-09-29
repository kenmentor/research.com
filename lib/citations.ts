export interface CiteMeta {
  title: string;
  authors: string[];
  venue: string;
  year?: number;
  doi: string;
}

function apaNames(authors: string[]): string {
  const parts = authors.map((full) => {
    const [first, ...rest] = full.trim().split(/\s+/);
    const surname = rest.pop() ?? first;
    const initials = [first, ...rest].filter((w) => w !== surname).map((w) => `${w[0]}.`);
    return `${surname}, ${initials.join(" ")}`.trim();
  });
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts.slice(0, -1).join(", ")}, & ${parts[parts.length - 1]}`;
}

export function formatAPA(m: CiteMeta): string {
  const year = m.year ? `(${m.year})` : "(n.d.)";
  const venue = m.venue ? ` ${m.venue}.` : "";
  const doi = m.doi ? ` https://doi.org/${m.doi}` : "";
  return `${apaNames(m.authors)} ${year}. ${m.title}.${venue}${doi}`;
}

export function formatMLA(m: CiteMeta): string {
  const names =
    m.authors.length <= 1
      ? (m.authors[0] ?? "")
      : `${m.authors[0]}, et al.`;
  const venue = m.venue ? ` ${m.venue},` : "";
  const year = m.year ? ` ${m.year}.` : "";
  const doi = m.doi ? ` doi:${m.doi}.` : "";
  return `${names} "${m.title}."${venue}${year}${doi}`;
}

export function formatBibTeX(m: CiteMeta, key: string): string {
  const esc = (v: string) => v.replace(/[{}]/g, "");
  const lines = [
    `@article{${key},`,
    `  author = {${m.authors.map(esc).join(" and ")}},`,
    `  title = {${esc(m.title)}},`,
    ...(m.venue ? [`  journal = {${esc(m.venue)}},`] : []),
    ...(m.year ? [`  year = {${m.year}},`] : []),
    ...(m.doi ? [`  doi = {${esc(m.doi)}},`] : []),
    `}`,
  ];
  return lines.join("\n");
}

export function bibtexKey(m: CiteMeta, id: string): string {
  const surname = (m.authors[0] ?? "anon").trim().split(/\s+/).pop() ?? "anon";
  return `${surname.toLowerCase().replace(/[^a-z]/g, "")}${m.year ?? "nd"}${id.slice(-4)}`;
}
