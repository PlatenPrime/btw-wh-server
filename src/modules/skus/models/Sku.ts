import mongoose, { Document, Model, Schema, Types } from "mongoose";

/**
 * Интерфейс документа SKU конкурента
 */
export interface ISku extends Document {
  _id: Types.ObjectId;
  konkName: string;
  prodName: string;
  /** Канонический ключ: `{konkNameLower}-{rawProductId}` */
  productId: string;
  btradeAnalog: string;
  title: string;
  url: string;
  imageUrl: string;
  /** true если 7 подряд дней срезов с stock=-1 и price=-1 (см. крон SkuInvalid). */
  isInvalid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const skuSchema = new Schema<ISku>(
  {
    konkName: { type: String, required: true },
    prodName: { type: String, required: true },
    productId: { type: String, required: true, unique: true },
    btradeAnalog: { type: String, default: "" },
    title: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    imageUrl: { type: String, default: "" },
    isInvalid: { type: Boolean, default: false },
  },
  { timestamps: true }
);

skuSchema.index({ konkName: 1, isInvalid: 1 });

/**
 * Sku Mongoose model
 * @see ISku
 */
export const Sku: Model<ISku> = mongoose.model<ISku>("Sku", skuSchema, "skus");
