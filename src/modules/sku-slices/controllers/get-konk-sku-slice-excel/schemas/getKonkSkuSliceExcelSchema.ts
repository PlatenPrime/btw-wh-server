import { z } from "zod";
import { dateStringSchema } from "../../common/schemas/dateSchema.js";

export const getKonkSkuSliceExcelSchema = z
  .object({
    konk: z.string().min(1, "konk is required"),
    prod: z.string().min(1, "prod is required"),
    dateFrom: dateStringSchema,
    dateTo: dateStringSchema,
  })
  .refine((data) => data.dateFrom.getTime() <= data.dateTo.getTime(), {
    message: "dateFrom must be before or equal to dateTo",
    path: ["dateTo"],
  });

export type GetKonkSkuSliceExcelInput = z.infer<typeof getKonkSkuSliceExcelSchema>;
