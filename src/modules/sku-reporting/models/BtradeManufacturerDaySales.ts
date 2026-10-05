import { Document, Model, Schema, Types } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";

/**
 * Дневной rollup продаж Btrade по производителю (Art.prodName, lowercased).
 * Пишется при materialize BtradeSlice; читают prod-konks-pie и sales-chart btrade sales.
 */
export interface IBtradeManufacturerDaySales extends Document {
  _id: Types.ObjectId;
  date: Date;
  /** Art.prodName, trimmed + lowercased (ключ агрегации). */
  prodName: string;
  salesPcs: number;
  salesUah: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const btradeManufacturerDaySalesSchema = new Schema<IBtradeManufacturerDaySales>(
  {
    date: { type: Date, required: true },
    prodName: { type: String, required: true },
    salesPcs: { type: Number, required: true, default: 0 },
    salesUah: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

btradeManufacturerDaySalesSchema.index({ date: 1, prodName: 1 }, { unique: true });

export const BtradeManufacturerDaySales: Model<IBtradeManufacturerDaySales> =
  getOrCreateModel<IBtradeManufacturerDaySales>(
    "BtradeManufacturerDaySales",
    btradeManufacturerDaySalesSchema,
    "btrade_manufacturer_day_sales",
  );
