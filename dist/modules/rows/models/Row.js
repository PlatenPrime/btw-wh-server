// models/Row.ts
import { Schema, Types } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";
/**
 * Row schema
 */
const rowSchema = new Schema({
    title: { type: String, required: true, unique: true },
    pallets: [{ type: Types.ObjectId, ref: "Pallet" }],
}, { timestamps: true });
/**
 * Row Mongoose model
 * @see IRow
 */
export const Row = getOrCreateModel("Row", rowSchema);
