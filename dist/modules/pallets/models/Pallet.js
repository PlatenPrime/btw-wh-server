// models/Pallet.ts
import { model, Schema } from "mongoose";
const palletSchema = new Schema({
    title: { type: String, required: true },
    rowId: { type: Schema.Types.ObjectId, ref: "Row", required: true },
    poses: [{ type: Schema.Types.ObjectId, ref: "Pos" }],
    sector: String,
}, { timestamps: true });
export { palletSchema };
/**
 * Pallet Mongoose model
 * @see IPallet
 */
export const Pallet = model("Pallet", palletSchema);
