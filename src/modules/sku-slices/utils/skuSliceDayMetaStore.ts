import { toSliceDate } from "../../../utils/sliceDate.js";
import {
  SkuSliceDayMeta,
  type ISkuSliceDayMeta,
} from "../models/SkuSliceDayMeta.js";
import type {
  ISkuSliceDayRunStats,
  ISkuSliceRotationMeta,
} from "../models/skuSliceTypes.js";

export type UpsertSkuSliceDayMetaInput = {
  konkName: string;
  date: Date;
  rotationMeta?: ISkuSliceRotationMeta | null;
  stats?: ISkuSliceDayRunStats | null;
};

/**
 * Upsert observability дневного прогона (без точек stock/price).
 */
export async function upsertSkuSliceDayMeta(
  input: UpsertSkuSliceDayMetaInput,
): Promise<ISkuSliceDayMeta> {
  const date = toSliceDate(input.date);
  const $set: Record<string, unknown> = {};
  const $unset: Record<string, 1> = {};

  if (input.rotationMeta !== undefined) {
    if (input.rotationMeta === null) {
      $unset.rotationMeta = 1;
    } else {
      $set.rotationMeta = input.rotationMeta;
    }
  }
  if (input.stats !== undefined) {
    if (input.stats === null) {
      $unset.stats = 1;
    } else {
      $set.stats = input.stats;
    }
  }

  const update: Record<string, unknown> = {
    $setOnInsert: { konkName: input.konkName, date },
  };
  if (Object.keys($set).length > 0) update.$set = $set;
  if (Object.keys($unset).length > 0) update.$unset = $unset;

  const doc = await SkuSliceDayMeta.findOneAndUpdate(
    { konkName: input.konkName, date },
    update,
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).exec();

  return doc!;
}

export async function getSkuSliceDayMeta(
  konkName: string,
  date: Date,
): Promise<ISkuSliceDayMeta | null> {
  return SkuSliceDayMeta.findOne({
    konkName,
    date: toSliceDate(date),
  }).exec();
}

export async function ensureSkuSliceDayMeta(
  konkName: string,
  date: Date,
): Promise<void> {
  const dateKey = toSliceDate(date);
  await SkuSliceDayMeta.findOneAndUpdate(
    { konkName, date: dateKey },
    { $setOnInsert: { konkName, date: dateKey } },
    { upsert: true },
  ).exec();
}
