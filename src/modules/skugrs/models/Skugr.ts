import mongoose, { Document, Model, Schema, Types } from "mongoose";

/**
 * Группа товаров конкурента: конкурент + производитель + набор SKU (документов Sku).
 */
export interface ISkugr extends Document {
  _id: Types.ObjectId;
  konkName: string;
  prodName: string;
  title: string;
  url: string;
  isSliced: boolean;
  skus: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const skugrSchema = new Schema<ISkugr>(
  {
    konkName: { type: String, required: true },
    prodName: { type: String, required: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    isSliced: { type: Boolean, required: true, default: true },
    skus: [
      {
        type: Schema.Types.ObjectId,
        ref: "Sku",
        required: true,
      },
    ],
  },
  { timestamps: true },
);

skugrSchema.index({ konkName: 1, prodName: 1 });

export const Skugr: Model<ISkugr> = mongoose.model<ISkugr>(
  "Skugr",
  skugrSchema,
  "skugrs",
);
