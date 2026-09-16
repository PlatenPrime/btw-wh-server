import { z } from "zod";
import { isExcelJobKind } from "../../../constants/excelJobConstants.js";

export const createExcelJobSchema = z.object({
  kind: z.string().refine(isExcelJobKind, { message: "Unknown excel job kind" }),
  params: z.record(z.unknown()).optional().default({}),
});

export type CreateExcelJobInput = z.infer<typeof createExcelJobSchema>;
