import type { PipelineStage } from "mongoose";
import { BtradeSlice } from "../models/BtradeSlice.js";

const dataAsEntryArray = { $objectToArray: { $ifNull: ["$data", {}] } };

/**
 * Проекция `data` среза Btrade только по списку артикулов (меньше трафика из Mongo).
 */
export function sliceDataProjectForArtikulList(
  allowedArtikuls: string[],
): PipelineStage {
  return {
    $project: {
      _id: 0,
      date: 1,
      data: {
        $arrayToObject: {
          $filter: {
            input: dataAsEntryArray,
            as: "p",
            cond: { $in: ["$$p.k", allowedArtikuls] },
          },
        },
      },
    },
  };
}

export type BtradeSliceAggregateRow = { date: Date; data?: unknown };

export async function aggregateBtradeSlices<
  T extends Record<string, unknown> = BtradeSliceAggregateRow,
>(pipeline: PipelineStage[]): Promise<T[]> {
  return BtradeSlice.aggregate<T>(pipeline)
    .option({ allowDiskUse: true })
    .exec();
}
