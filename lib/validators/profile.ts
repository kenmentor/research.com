import { z } from "zod";

const visibilitySchema = z.enum(["public", "connections"]);

export const experienceSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(120),
  organization: z.string().trim().min(1, "Organization is required.").max(160),
  start: z.string().trim().min(1, "Start date is required.").max(20),
  end: z.string().trim().max(20).optional(),
  current: z.boolean().default(false),
  description: z.string().trim().max(1000).default(""),
});

export const educationSchema = z.object({
  school: z.string().trim().min(1, "School is required.").max(160),
  degree: z.string().trim().min(1, "Degree is required.").max(160),
  field: z.string().trim().max(160).default(""),
  startYear: z.number().int().min(1900).max(2100).optional(),
  endYear: z.number().int().min(1900).max(2100).optional(),
});

export const grantSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(160),
  funder: z.string().trim().min(1, "Funder is required.").max(160),
  year: z.number().int().min(1900).max(2100).optional(),
  amount: z.string().trim().max(60).default(""),
});

/**
 * Owner profile patch. All optional; arrays use replace semantics
 * (client sends the full list). No partial saves: the whole body must
 * validate or nothing persists.
 */
export const profilePatchSchema = z.object({
  headline: z.string().trim().min(4).max(160).optional(),
  affiliation: z.string().trim().min(2).max(160).optional(),
  location: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(2000).optional(),
  interests: z
    .array(z.string().trim().min(1))
    .max(20)
    .transform((list) => [...new Set(list.map((t) => t.toLowerCase()))])
    .optional(),
  experience: z.array(experienceSchema).max(30).optional(),
  education: z.array(educationSchema).max(20).optional(),
  grants: z.array(grantSchema).max(30).optional(),
  sectionVisibility: z
    .object({
      about: visibilitySchema.optional(),
      interests: visibilitySchema.optional(),
      experience: visibilitySchema.optional(),
      education: visibilitySchema.optional(),
      grants: visibilitySchema.optional(),
    })
    .optional(),
});

export type ProfilePatchInput = z.infer<typeof profilePatchSchema>;
