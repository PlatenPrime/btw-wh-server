// models/Pos.ts
import { model, Schema } from "mongoose";
const posSchema = new Schema({
    palletId: { type: Schema.Types.ObjectId, ref: "Pallet", required: true },
    rowId: { type: Schema.Types.ObjectId, ref: "Row", required: true },
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
