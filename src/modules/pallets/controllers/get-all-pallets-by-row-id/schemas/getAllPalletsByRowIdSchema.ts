import { z } from "zod";

export const getAllPalletsByRowIdSchema = z.object({
  rowId: z.string().min(1, "Row ID is required"),
});

export type GetAllPalletsByRowIdInput = z.infer<
  typeof getAllPalletsByRowIdSchema
>;







