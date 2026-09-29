import { z } from "zod";

const DOI_RE = /^10\.\d{4,}\/\S+$/i;

function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  for (const raw of tags) {
    const t = raw.trim().toLowerCase();
    if (t && !seen.has(t)) seen.add(t);
  }
  return [...seen];
}

export const authorSchema = z.object({
  name: z.string().trim().min(1, "Author name is required.").max(160),
  profileId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid profile id.").optional(),
});

const baseFields = {
  title: z.string().trim().min(1, "Title is required.").max(300),
  authors: z.array(authorSchema).min(1, "Add at least one author.").max(30),
  venue: z.string().trim().max(200).default(""),
  year: z.number().int().min(1900).max(2100).optional(),
  doi: z
    .string()
    .trim()
    .max(100)
    .refine((v) => v === "" || DOI_RE.test(v), "DOI looks like 10.xxxx/xxxxx.")
    .default(""),
  abstract: z.string().trim().max(5000).default(""),
  tags: z.array(z.string()).max(20).default([]).transform(normalizeTags),
  /** External PDF URL only — raw bytes are never accepted or stored. */
  fileUrl: z
    .string()
    .trim()
    .max(2000)
    .refine(
      (v) => v === "" || /^https?:\/\/.+\..+/.test(v),
      "PDF must be an http(s) URL.",
    )
    .default(""),
  featured: z.boolean().default(false),
};

export const publicationCreateSchema = z.object(baseFields);

export const publicationPatchSchema = z
  .object({
    ...baseFields,
    title: baseFields.title.optional(),
    authors: z.array(authorSchema).min(1).max(30).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Nothing to update.");

export type PublicationCreateInput = z.infer<typeof publicationCreateSchema>;
export type PublicationPatchInput = z.infer<typeof publicationPatchSchema>;
