// models/Row.ts
import { model, Schema, Types } from "mongoose";
/**
 * Row schema
 */
const rowSchema = new Schema({
    title: { type: String, required: true },
    pallets: [{ type: Types.ObjectId, ref: "Pallet" }],
}, { timestamps: true });
/**
 * Row Mongoose model
 * @see IRow
 */
export const Row = model("Row", rowSchema);
