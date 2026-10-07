import { Document, Model, Schema, Types } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";
import type { ISkuSliceDataItem } from "./SkuSlice.js";

/**
 * Месячный срез по одному SKU: дни месяца в `days` с ключами YYYY-MM-DD.
 * Параллельная проекция ключей `SkuSlice.data`; runtime отчёты пока читают Mixed.
 */
export interface ISkuSliceMonth extends Document {
  _id: Types.ObjectId;
  konkName: string;
  productId: string;
  /** UTC midnight первого дня месяца. */
  month: Date;
  /** Ключи — YYYY-MM-DD (UTC), значения — stock/price (включая -1). */
  days: Record<string, ISkuSliceDataItem>;
  createdAt?: Date;
  updatedAt?: Date;
}

const skuSliceMonthSchema = new Schema<ISkuSliceMonth>(
  {
    konkName: { type: String, required: true },
    productId: { type: String, required: true },
    month: { type: Date, required: true },
    days: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

skuSliceMonthSchema.index(
  { konkName: 1, productId: 1, month: 1 },
  { unique: true },
);

export const SkuSliceMonth: Model<ISkuSliceMonth> =
  getOrCreateModel<ISkuSliceMonth>(
    "SkuSliceMonth",
    skuSliceMonthSchema,
    "sku_slice_months",
  );
