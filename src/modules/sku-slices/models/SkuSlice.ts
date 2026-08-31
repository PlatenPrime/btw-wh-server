import { Document, Model, Schema, Types } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";

export interface ISkuSliceDataItem {
  stock: number;
  price: number;
}

/** Мета rotation-среза (observability; логика due — hash productId). */
export interface ISkuSliceRotationMeta {
  cycleDays: number;
  dayIndex: number;
  dueCount: number;
}

/**
 * Ежедневный срез остатков и цен SKU конкурента; ключи в data — Sku.productId.
 */
export interface ISkuSlice extends Document {
  _id: Types.ObjectId;
  konkName: string;
  date: Date;
  data: Record<string, ISkuSliceDataItem>;
  rotationMeta?: ISkuSliceRotationMeta;
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
    rotationMeta: {
      type: {
        cycleDays: { type: Number },
        dayIndex: { type: Number },
        dueCount: { type: Number },
      },
      required: false,
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
