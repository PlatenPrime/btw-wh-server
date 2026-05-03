import type { Types } from "mongoose";
import mongoose from "mongoose";
import { Skugr } from "../../skugrs/models/Skugr.js";

/**
 * Все ObjectId, которые встречаются хотя бы в одном массиве `Skugr.skus`.
 */
export async function loadSkuIdsReferencedByAnySkugr(): Promise<Types.ObjectId[]> {
  const raw = (await Skugr.distinct("skus")) as unknown[];
  const out: Types.ObjectId[] = [];
  for (const id of raw) {
    if (id == null) continue;
    if (id instanceof mongoose.Types.ObjectId) {
      out.push(id);
      continue;
    }
    const s = String(id);
    if (mongoose.Types.ObjectId.isValid(s) && new mongoose.Types.ObjectId(s).toString() === s) {
      out.push(new mongoose.Types.ObjectId(s));
    }
  }
  return out;
}
