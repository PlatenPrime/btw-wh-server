import type { PipelineStage } from "mongoose";
import { SkuSlice } from "../models/SkuSlice.js";

/** $objectToArray для поля data среза (Mixed / объект ключ → метрики). */
const dataAsEntryArray = { $objectToArray: { $ifNull: ["$data", {}] } };

/**
 * Оставляет в документе только `date` и `data`, суженный до одного productId.
 * Форма совместима с прежним `.select("date data").lean()`.
 */
export function sliceDataProjectForSingleProductId(
  productKey: string
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
            cond: { $eq: ["$$p.k", productKey] },
          },
        },
      },
    },
  };
}

/**
 * Оставляет `konkName`, `date` и `data`, отфильтрованный по списку productId (для Skugr / групп SKU).
 */
export function sliceDataProjectForProductIdList(
  allowedProductIds: string[]
): PipelineStage {
  return {
    $project: {
      _id: 0,
      konkName: 1,
      date: 1,
      data: {
        $arrayToObject: {
          $filter: {
            input: dataAsEntryArray,
            as: "p",
            cond: { $in: ["$$p.k", allowedProductIds] },
          },
        },
      },
    },
  };
}

/** Строка после проекции «один productId» (date + урезанный data). */
export type SliceAggregateRowSingle = { date: Date; data?: unknown };

/** Строка после проекции по списку productId (для Skugr / несколько конкурентов). */
export type SliceAggregateRowWithKonk = {
  konkName: string;
  date: Date;
  data?: unknown;
};

export async function aggregateSkuSlices<
  T extends Record<string, unknown> = SliceAggregateRowSingle,
>(pipeline: PipelineStage[]): Promise<T[]> {
  return SkuSlice.aggregate<T>(pipeline)
    .option({ allowDiskUse: true })
    .exec();
}
