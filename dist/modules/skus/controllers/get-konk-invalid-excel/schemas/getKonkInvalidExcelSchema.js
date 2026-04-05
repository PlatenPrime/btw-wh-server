import { z } from "zod";
export const getKonkInvalidExcelParamsSchema = z.object({
    konkName: z.string().min(1, "konkName is required"),
});
