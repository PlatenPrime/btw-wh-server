import { z } from "zod";
import { dateStringSchema } from "../../../../sku-reporting/schemas/dateSchema.js";
import { enumerateSliceDates } from "../../../../slices/utils/enumerateSliceDates.js";
import { normalizeCompetitorName } from "../../../../slices/config/excludedCompetitors.js";

export const MAX_DISCOVER_BAND_SPIKE_RANGE_DAYS = 93;

const stockBoundSchema = z.number().finite().nonnegative();

export const discoverBandSpikeSchema = z
  .object({
    konkName: z
      .string()
      .min(1, "konkName is required")
      .transform((value) => normalizeCompetitorName(value))
      .refine((value) => value.length > 0, {
        message: "konkName is required",
      }),
    stockMin: stockBoundSchema,
    stockMax: stockBoundSchema,
    dateFrom: dateStringSchema,
    dateTo: dateStringSchema,
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.stockMin > data.stockMax) {
      ctx.addIssue({
        code: "custom",
        message: "stockMin must be less than or equal to stockMax",
        path: ["stockMax"],
      });
    }
    if (data.dateFrom.getTime() > data.dateTo.getTime()) {
      ctx.addIssue({
        code: "custom",
        message: "dateFrom must be before or equal to dateTo",
        path: ["dateTo"],
      });
      return;
    }
    const days = enumerateSliceDates(data.dateFrom, data.dateTo);
    if (days.length > MAX_DISCOVER_BAND_SPIKE_RANGE_DAYS) {
      ctx.addIssue({
        code: "custom",
        message: `date range must be at most ${MAX_DISCOVER_BAND_SPIKE_RANGE_DAYS} days`,
        path: ["dateTo"],
      });
    }
  });

export type DiscoverBandSpikeInput = z.infer<typeof discoverBandSpikeSchema>;
