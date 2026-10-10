import { Document, Model, Schema, Types } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";
import type {
  ISkuSliceDayRunStats,
  ISkuSliceRotationMeta,
} from "./skuSliceTypes.js";

/**
 * Observability дневного прогона среза конкурента: meta/stats без точек stock/price.
 * Точки живут в SkuSliceMonth.
 */
export interface ISkuSliceDayMeta extends Document {
  _id: Types.ObjectId;
  konkName: string;
  date: Date;
  rotationMeta?: ISkuSliceRotationMeta;
  stats?: ISkuSliceDayRunStats;
  createdAt?: Date;
  updatedAt?: Date;
}

const skuSliceDayMetaSchema = new Schema<ISkuSliceDayMeta>(
  {
    konkName: { type: String, required: true },
    date: { type: Date, required: true },
    rotationMeta: {
      type: new Schema(
        {
          cycleDays: { type: Number },
          dayIndex: { type: Number },
          dueCount: { type: Number },
        },
        { _id: false },
      ),
      required: false,
    },
    stats: {
      type: new Schema(
        {
          filled: { type: Number },
          invalid: { type: Number },
          errorCount: { type: Number },
          dueTotal: { type: Number },
          abortReason: { type: String },
        },
        { _id: false },
      ),
      required: false,
    },
  },
  { timestamps: true },
);

skuSliceDayMetaSchema.index({ konkName: 1, date: 1 }, { unique: true });

export const SkuSliceDayMeta: Model<ISkuSliceDayMeta> =
  getOrCreateModel<ISkuSliceDayMeta>(
    "SkuSliceDayMeta",
    skuSliceDayMetaSchema,
    "sku_slice_day_metas",
  );
