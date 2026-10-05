import { Document, Model, Schema, Types } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";

/**
 * Дневной rollup продаж конкурента по производителю (Prod.name).
 * Пишется при materialize срезов; читают manufacturers-pie, prod-konks-pie
 * (без skugrIds) и sales-chart competitor sales/revenue.
 */
export interface ISkuManufacturerDaySales extends Document {
  _id: Types.ObjectId;
  konkName: string;
  date: Date;
  /** Prod.name */
  prodName: string;
  salesPcs: number;
  salesUah: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const skuManufacturerDaySalesSchema = new Schema<ISkuManufacturerDaySales>(
  {
    konkName: { type: String, required: true },
    date: { type: Date, required: true },
    prodName: { type: String, required: true },
    salesPcs: { type: Number, required: true, default: 0 },
    salesUah: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

skuManufacturerDaySalesSchema.index(
  { konkName: 1, date: 1, prodName: 1 },
  { unique: true },
);

export const SkuManufacturerDaySales: Model<ISkuManufacturerDaySales> =
  getOrCreateModel<ISkuManufacturerDaySales>(
    "SkuManufacturerDaySales",
    skuManufacturerDaySalesSchema,
    "sku_manufacturer_day_sales",
  );
