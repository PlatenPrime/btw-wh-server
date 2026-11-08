import mongoose from "mongoose";
import { z } from "zod";
import { dateStringSchema } from "../../../../sku-reporting/schemas/dateSchema.js";
import { enumerateSliceDates } from "../../../../slices/utils/enumerateSliceDates.js";
import { MAX_DISCOVER_BAND_SPIKE_RANGE_DAYS } from "../../discover-band-spike/schemas/discoverBandSpikeSchema.js";

export const discoverStockBandSchema = z
  .object({
    bandId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid band ID format",
    }),
    dateFrom: dateStringSchema,
    dateTo: dateStringSchema,
  })
  .strict()
  .superRefine((data, ctx) => {
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

export type DiscoverStockBandInput = z.infer<typeof discoverStockBandSchema>;
