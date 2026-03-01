import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IBtradeSliceDataItem {
  price: number;
  quantity: number;
}

/**
 * Документ ежедневного среза цен и остатков Btrade (Sharik) по артикулам из analogs
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
  { timestamps: true }
);

export const BtradeSlice: Model<IBtradeSlice> = mongoose.model<IBtradeSlice>(
  "BtradeSlice",
  btradeSliceSchema,
  "btrade_slices"
);
