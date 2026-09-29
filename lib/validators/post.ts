import { z } from "zod";

const IMAGE_EXT = /\.(png|jpe?g|webp)(\?.*)?$/i;

export const postCreateSchema = z
  .object({
    body: z.string().trim().min(1, "Write something first.").max(5000),
    linkUrl: z
      .string()
      .trim()
      .max(2000)
      .refine((v) => v === "" || /^https?:\/\/.+\..+/.test(v), "Link must be an http(s) URL.")
      .default(""),
    /** External image URL only (direct uploads land in Phase 11). */
    imageUrl: z
      .string()
      .trim()
      .max(2000)
      .refine(
        (v) => v === "" || (/^https?:\/\/.+\..+/.test(v) && IMAGE_EXT.test(v)),
        "Image must be an http(s) png/jpg/webp URL under 5 MB.",
      )
      .default(""),
    publicationId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid paper.")
      .optional(),
    repostOf: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid post.")
      .optional(),
  })
  .refine((v) => !v.repostOf || v.body.length <= 5000, "Quote too long.");

export const commentCreateSchema = z.object({
  body: z.string().trim().min(1, "Write a comment first.").max(1000),
});

export type PostCreateInput = z.infer<typeof postCreateSchema>;
