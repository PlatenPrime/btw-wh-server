import { Document, Model, Schema, Types } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";

export interface ISkuSliceDataItem {
  stock: number;
  price: number;
}

/**
 * Ежедневный срез остатков и цен SKU конкурента; ключи в data — Sku.productId.
 */
export interface ISkuSlice extends Document {
  _id: Types.ObjectId;
  konkName: string;
  date: Date;
  data: Record<string, ISkuSliceDataItem>;
  createdAt?: Date;
  updatedAt?: Date;
}

const skuSliceSchema = new Schema<ISkuSlice>(
  {
    konkName: { type: String, required: true },
    date: { type: Date, required: true },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

skuSliceSchema.index({ konkName: 1, date: 1 }, { unique: true });

export const SkuSlice: Model<ISkuSlice> = getOrCreateModel<ISkuSlice>(
  "SkuSlice",
  skuSliceSchema,
  "sku_slices",
);
