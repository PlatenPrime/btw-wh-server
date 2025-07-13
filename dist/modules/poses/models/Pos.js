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
    palletTitle: String,
    rowTitle: String,
    artikul: String,
    quant: Number,
    boxes: Number,
    date: String,
    sklad: String,
}, { timestamps: true });
/**
 * Pos Mongoose model
 * @see IPos
 */
export const Pos = model("Pos", posSchema);
