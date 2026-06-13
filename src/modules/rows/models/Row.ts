// models/Row.ts
import { Document, Model, Schema, Types } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";

/**
 * Row document interface
 */
export interface IRow extends Document {
  _id: Types.ObjectId;
  title: string;
  pallets: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Row schema
 */
const rowSchema = new Schema<IRow>(
  {
    title: { type: String, required: true, unique: true },
    pallets: [{ type: Types.ObjectId, ref: "Pallet" }],
  },
  { timestamps: true }
);

/**
 * Row Mongoose model
 * @see IRow
 */
export const Row: Model<IRow> = getOrCreateModel<IRow>("Row", rowSchema);
