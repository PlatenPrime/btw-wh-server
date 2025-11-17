import { z } from "zod";

export const updateAllBtradeStocksSchema = z.object({});

export type UpdateAllBtradeStocksInput = z.infer<
  typeof updateAllBtradeStocksSchema
>;

