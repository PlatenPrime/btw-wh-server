import { AnalogSlice } from "../../../models/AnalogSlice.js";
import type { IAnalogSliceDataItem } from "../../../models/AnalogSlice.js";
import type { GetAnalogSliceQuery } from "../schemas/getAnalogSliceQuerySchema.js";

/**
 * Возвращает документ среза по konkName и дате (начало дня UTC).
 */
export async function getAnalogSliceUtil(
  input: GetAnalogSliceQuery
): Promise<{ konkName: string; date: Date; data: Record<string, IAnalogSliceDataItem> } | null> {
  const doc = await AnalogSlice.findOne({
    konkName: input.konkName,
    date: input.date,
  })
    .select("konkName date data")
    .lean();

  if (!doc) return null;

  return {
    konkName: doc.konkName,
    date: doc.date,
    data: doc.data as Record<string, IAnalogSliceDataItem>,
  };
}
