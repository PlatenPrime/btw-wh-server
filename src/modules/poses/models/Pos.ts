// models/Pos.ts
import { model, Schema, Types } from "mongoose";

const posSchema = new Schema({
  pallet: { type: Types.ObjectId, ref: "Pallet", required: true },
  palletTitle: String,
  rowTitle: String,
  artikul: String,
  quant: Number,
  boxes: Number,
  date: String,
  sklad: String,
},
  { timestamps: true });

export const Pos = model("Pos", posSchema);
