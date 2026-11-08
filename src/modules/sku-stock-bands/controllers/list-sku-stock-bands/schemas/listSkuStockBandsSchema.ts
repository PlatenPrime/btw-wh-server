import { z } from "zod";
import { normalizeCompetitorName } from "../../../../slices/config/excludedCompetitors.js";

export const listSkuStockBandsSchema = z
  .object({
    konkName: z
      .string()
      .optional()
      .transform((value) => {
        if (value === undefined || value.trim() === "") return undefined;
        return normalizeCompetitorName(value);
      })
      .refine((value) => value === undefined || value.length > 0, {
        message: "konkName must be non-empty when provided",
      }),
  })
  .strict();

export type ListSkuStockBandsInput = {
  konkName?: string;
};
