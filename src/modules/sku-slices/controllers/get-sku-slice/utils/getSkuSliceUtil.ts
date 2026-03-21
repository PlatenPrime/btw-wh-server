import { SkuSlice } from "../../../models/SkuSlice.js";
import type { ISkuSliceDataItem } from "../../../models/SkuSlice.js";
import type { GetSkuSliceQuery } from "../schemas/getSkuSliceQuerySchema.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";

export async function getSkuSliceUtil(
  input: GetSkuSliceQuery
): Promise<{
  konkName: string;
  date: Date;
  data: Record<string, ISkuSliceDataItem>;
} | null> {
  const sliceDate = toSliceDate(input.date);
  const doc = await SkuSlice.findOne({
    konkName: input.konkName,
    date: sliceDate,
  })
    .select("konkName date data")
    .lean();

  if (!doc) return null;

  return {
    konkName: doc.konkName,
    date: doc.date,
    data: (doc.data ?? {}) as Record<string, ISkuSliceDataItem>,
  };
}
