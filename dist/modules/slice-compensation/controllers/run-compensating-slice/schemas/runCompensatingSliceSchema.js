import { z } from "zod";
import { normalizeCompetitorName } from "../../../../slices/config/excludedCompetitors.js";
export const runCompensatingSliceSchema = z.object({
    konkName: z
        .string()
        .min(1, "konkName is required")
        .transform((value) => normalizeCompetitorName(value))
        .refine((value) => value.length > 0, {
        message: "konkName is required",
    }),
});
