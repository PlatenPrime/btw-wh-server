// models/Pallet.ts
import { model, Schema } from "mongoose";
const rowSubdocumentSchema = new Schema({
    _id: { type: Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
}, { _id: false });
const palletSchema = new Schema({
    title: { type: String, required: true },
    row: { type: rowSubdocumentSchema, required: true },
    poses: [{ type: Schema.Types.ObjectId, ref: "Pos" }],
    sector: String,
}, { timestamps: true });
export { palletSchema };
/**
 * Pallet Mongoose model
 * @see IPallet
 */
export const Pallet = model("Pallet", palletSchema);
