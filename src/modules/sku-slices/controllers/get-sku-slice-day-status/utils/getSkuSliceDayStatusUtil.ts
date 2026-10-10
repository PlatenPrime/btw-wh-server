import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { getSkuSliceDayMeta } from "../../../utils/skuSliceDayMetaStore.js";
import { findDayPointsPage } from "../../../utils/skuSliceMonthStore.js";
import type { GetSkuSliceDayStatusQuery } from "../schemas/getSkuSliceDayStatusSchema.js";

export type GetSkuSliceDayStatusResult = {
  konkName: string;
  date: Date;
  rotationMeta: {
    cycleDays: number;
    dayIndex: number;
    dueCount: number;
  } | null;
  stats: {
    filled: number;
    invalid: number;
    errorCount: number;
    dueTotal?: number;
    abortReason?: string;
  } | null;
  /** Сколько точек есть в months за день (включая -1). */
  pointsTotal: number;
  /** Сколько invalid точек в months за день. */
  pointsInvalid: number;
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * Observability дневного прогона: DayMeta + счётчики точек из months.
 */
export async function getSkuSliceDayStatusUtil(
  input: GetSkuSliceDayStatusQuery,
): Promise<GetSkuSliceDayStatusResult> {
  const sliceDate = toSliceDate(input.date);
  const meta = await getSkuSliceDayMeta(input.konkName, sliceDate);

  const [allPage, invalidPage] = await Promise.all([
    findDayPointsPage({
      konkName: input.konkName,
      date: sliceDate,
      page: 1,
      limit: 1,
    }),
    findDayPointsPage({
      konkName: input.konkName,
      date: sliceDate,
      page: 1,
      limit: 1,
      isInvalid: true,
    }),
  ]);

  return {
    konkName: input.konkName,
    date: sliceDate,
    rotationMeta: meta?.rotationMeta
      ? {
          cycleDays: meta.rotationMeta.cycleDays,
          dayIndex: meta.rotationMeta.dayIndex,
          dueCount: meta.rotationMeta.dueCount,
        }
      : null,
    stats: meta?.stats
      ? {
          filled: meta.stats.filled,
          invalid: meta.stats.invalid,
          errorCount: meta.stats.errorCount,
          ...(meta.stats.dueTotal !== undefined
            ? { dueTotal: meta.stats.dueTotal }
            : {}),
          ...(meta.stats.abortReason
            ? { abortReason: meta.stats.abortReason }
            : {}),
        }
      : null,
    pointsTotal: allPage.total,
    pointsInvalid: invalidPage.total,
    createdAt: meta?.createdAt,
    updatedAt: meta?.updatedAt,
  };
}
