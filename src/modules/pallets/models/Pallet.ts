// models/Pallet.ts
import { model, Schema, Types } from "mongoose";

const palletSchema = new Schema(
  {
    title: { type: String, required: true },
    rowId: { type: Types.ObjectId, ref: "Row", required: true },
    poses: [{ type: Types.ObjectId, ref: "Pos" }],
    sector: String,
  },
  { timestamps: true }
);

export { palletSchema };

export const Pallet = model("Pallet", palletSchema);
