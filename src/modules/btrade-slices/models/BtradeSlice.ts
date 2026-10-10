import { Document, Model, Schema, Types } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";
import type { IBtradeSliceDataItem } from "./btradeSliceTypes.js";

export type { IBtradeSliceDataItem } from "./btradeSliceTypes.js";

/**
 * Legacy daily Mixed: `(date)` + `data[artikul]`.
 * Runtime stock/price — в BtradeSliceMonth; эта коллекция только для migrate/verify.
 */
export interface IBtradeSlice extends Document {
  _id: Types.ObjectId;
  date: Date;
  data: Record<string, IBtradeSliceDataItem>;
  createdAt?: Date;
  updatedAt?: Date;
}

const btradeSliceSchema = new Schema<IBtradeSlice>(
  {
    date: { type: Date, required: true, unique: true },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

export const BtradeSlice: Model<IBtradeSlice> = getOrCreateModel<IBtradeSlice>(
  "BtradeSlice",
  btradeSliceSchema,
  "btrade_slices",
);
