import { Document, Model, Schema, Types } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";

export type SkuStockBandKonk = {
  name: string;
  title: string;
};

/**
 * Сохранённый диапазон аномального остатка конкурента (band + normalMax).
 */
export interface ISkuStockBand extends Document {
  _id: Types.ObjectId;
  konk: SkuStockBandKonk;
  stockMin: number;
  stockMax: number;
  normalMax: number;
  createdAt: Date;
  updatedAt: Date;
}

const skuStockBandSchema = new Schema<ISkuStockBand>(
  {
    konk: {
      name: { type: String, required: true, trim: true, lowercase: true },
      title: { type: String, required: true, trim: true },
    },
    stockMin: { type: Number, required: true, min: 0 },
    stockMax: { type: Number, required: true, min: 0 },
    normalMax: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

skuStockBandSchema.index({ "konk.name": 1 });

skuStockBandSchema.path("stockMax").validate(function (this: ISkuStockBand, value: number) {
  return typeof this.stockMin !== "number" || value >= this.stockMin;
}, "stockMax must be >= stockMin");

skuStockBandSchema.path("normalMax").validate(function (this: ISkuStockBand, value: number) {
  return typeof this.stockMin !== "number" || value < this.stockMin;
}, "normalMax must be < stockMin");

/**
 * SkuStockBand Mongoose model
 * @see ISkuStockBand
 */
export const SkuStockBand: Model<ISkuStockBand> = getOrCreateModel<ISkuStockBand>(
  "SkuStockBand",
  skuStockBandSchema,
  "sku_stock_bands",
);
