import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IAnalogSliceDataItem {
  stock: number;
  price: number;
  /** Заполняется из аналога, если поле artikul не пустое */
  artikul?: string;
  /** Заполняется из аналога, если artikul пустой, но есть title */
  title?: string;
}

/**
 * Документ ежедневного среза остатков и цен аналогов по конкуренту
 */
export interface IAnalogSlice extends Document {
  _id: Types.ObjectId;
  konkName: string;
  date: Date;
  data: Record<string, IAnalogSliceDataItem>;
  createdAt?: Date;
  updatedAt?: Date;
}

const analogSliceSchema = new Schema<IAnalogSlice>(
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

analogSliceSchema.index({ konkName: 1, date: 1 }, { unique: true });

export const AnalogSlice: Model<IAnalogSlice> = mongoose.model<IAnalogSlice>(
  "AnalogSlice",
  analogSliceSchema,
  "analog_slices"
);
