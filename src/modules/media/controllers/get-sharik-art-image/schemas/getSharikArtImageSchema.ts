import { z } from "zod";

const ARTIKUL_SAFE_RE = /^[A-Za-z0-9._-]+$/;

export const getSharikArtImageSchema = z.object({
  artikul: z
    .string()
    .trim()
    .min(1, "Artikul is required")
    .max(64, "Artikul must be at most 64 characters")
    .regex(ARTIKUL_SAFE_RE, "Artikul contains invalid characters")
    .refine((value) => !value.includes(".."), {
      message: "Artikul must not contain path traversal segments",
    }),
  size: z.enum(["prev", "big"]).default("prev"),
});

export type GetSharikArtImageInput = z.infer<typeof getSharikArtImageSchema>;
