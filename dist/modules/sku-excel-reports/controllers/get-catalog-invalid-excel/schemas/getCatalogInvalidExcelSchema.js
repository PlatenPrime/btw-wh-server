import { z } from "zod";
export const getCatalogInvalidExcelQuerySchema = z.object({
    konk: z.string().min(1, "konk is required"),
});
