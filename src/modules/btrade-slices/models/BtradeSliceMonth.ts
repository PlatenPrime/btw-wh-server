import { Document, Model, Schema, Types } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";
import type { IBtradeSliceDataItem } from "./btradeSliceTypes.js";

/**
 * Source of truth по точкам quantity/price Btrade: один документ на (artikul, month),
 * дни месяца в `days` с ключами YYYY-MM-DD.
 */
export interface IBtradeSliceMonth extends Document {
  _id: Types.ObjectId;
  artikul: string;
  /** UTC midnight первого дня месяца. */
  month: Date;
  /** Ключи — YYYY-MM-DD (UTC), значения — quantity/price (включая -1). */
  days: Record<string, IBtradeSliceDataItem>;
  createdAt?: Date;
  updatedAt?: Date;
}

const btradeSliceMonthSchema = new Schema<IBtradeSliceMonth>(
  {
    artikul: { type: String, required: true },
    month: { type: Date, required: true },
    days: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

btradeSliceMonthSchema.index({ artikul: 1, month: 1 }, { unique: true });

/** Day-wide scan по month без artikul. */
btradeSliceMonthSchema.index({ month: 1 });

export const BtradeSliceMonth: Model<IBtradeSliceMonth> =
  getOrCreateModel<IBtradeSliceMonth>(
    "BtradeSliceMonth",
    btradeSliceMonthSchema,
    "btrade_slice_months",
  );
