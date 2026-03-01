import { BtradeSlice } from "../../../models/BtradeSlice.js";
import type { GetBtradeSliceQuery } from "../schemas/getBtradeSliceQuerySchema.js";

/**
 * Возвращает документ среза Btrade по дате (начало дня UTC).
 */
export async function getBtradeSliceUtil(
  input: GetBtradeSliceQuery
): Promise<{
  date: Date;
  data: Record<string, { price: number; quantity: number }>;
} | null> {
  const doc = await BtradeSlice.findOne({ date: input.date })
    .select("date data")
    .lean();

  if (!doc) return null;

  return {
    date: doc.date,
    data: doc.data as Record<string, { price: number; quantity: number }>,
  };
}
