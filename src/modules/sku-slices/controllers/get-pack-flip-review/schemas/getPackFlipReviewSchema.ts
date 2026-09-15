import { z } from "zod";
import { dateStringSchema } from "../../../../sku-reporting/schemas/dateSchema.js";
import { normalizeCompetitorName } from "../../../../slices/config/excludedCompetitors.js";

export const getPackFlipReviewSchema = z
  .object({
    konkName: z
      .string()
      .min(1, "konkName is required")
      .transform((value) => normalizeCompetitorName(value))
      .refine((value) => value.length > 0, {
        message: "konkName is required",
      }),
    dateFrom: dateStringSchema,
    dateTo: dateStringSchema,
  })
  .refine((data) => data.dateFrom.getTime() <= data.dateTo.getTime(), {
    message: "dateFrom must be before or equal to dateTo",
    path: ["dateTo"],
  });

export type GetPackFlipReviewInput = z.infer<typeof getPackFlipReviewSchema>;
