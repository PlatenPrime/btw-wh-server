// models/Row.ts
import { Document, Model, model, Schema, Types } from "mongoose";

/**
 * Row document interface
 */
export interface IRow extends Document {
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
    title: { type: String, required: true },
    pallets: [{ type: Types.ObjectId, ref: "Pallet" }],
  },
  { timestamps: true }
);

/**
 * Row Mongoose model
 * @see IRow
 */
export const Row: Model<IRow> = model<IRow>("Row", rowSchema);
