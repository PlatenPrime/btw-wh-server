// models/Pos.ts
import { model, Schema } from "mongoose";
const palletSubdocumentSchema = new Schema({
    _id: { type: Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
    sector: String,
}, { _id: false });
const rowSubdocumentSchema = new Schema({
    _id: { type: Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
}, { _id: false });
const posSchema = new Schema({
    pallet: { type: palletSubdocumentSchema, required: true },
    row: { type: rowSubdocumentSchema, required: true },
    palletTitle: { type: String, required: true }, // Required for data integrity
    rowTitle: { type: String, required: true }, // Required for data integrity
    artikul: { type: String, required: true }, // Required for data integrity
    quant: { type: Number, required: true }, // Required for data integrity
    boxes: { type: Number, required: true }, // Required for data integrity
    date: String, // Optional date information
    sklad: String, // Optional warehouse identifier
}, { timestamps: true });
/**
 * Pos Mongoose model
 * @see IPos
 */
export const Pos = model("Pos", posSchema);
