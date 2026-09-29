import { z } from "zod";

export const usernameSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(
    /^[a-z0-9_.-]+$/,
    "Lowercase letters, numbers, dot, dash, underscore only.",
  );

export const onboardingSchema = z.object({
  displayName: z.string().trim().min(2, "Enter your full name."),
  username: usernameSchema.optional(),
  headline: z.string().trim().min(4, "Add a headline, e.g. your field + role."),
  affiliation: z.string().trim().min(2, "Add your institution."),
  interests: z
    .array(z.string().trim().min(1))
    .min(1, "Pick at least one interest.")
    .max(10)
    .transform((list) => [...new Set(list.map((t) => t.toLowerCase()))]),
  bio: z.string().trim().max(500).optional(),
  location: z.string().trim().max(120).optional(),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
