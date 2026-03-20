import mongoose, { Document, Model, Schema, Types } from "mongoose";

/**
 * Интерфейс документа SKU конкурента
 */
export interface ISku extends Document {
  _id: Types.ObjectId;
  konkName: string;
  prodName: string;
  btradeAnalog: string;
  title: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

const skuSchema = new Schema<ISku>(
  {
    konkName: { type: String, required: true },
    prodName: { type: String, required: true },
    btradeAnalog: { type: String, default: "" },
    title: { type: String, required: true },
    url: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

/**
 * Sku Mongoose model
 * @see ISku
 */
export const Sku: Model<ISku> = mongoose.model<ISku>("Sku", skuSchema, "skus");
