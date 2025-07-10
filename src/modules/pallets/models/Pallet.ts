// models/Pallet.ts
import { Document, model, Schema, Types } from "mongoose";

/**
 * Pallet document interface
 */
export interface IPallet extends Document {
  title: string;
  rowId: Types.ObjectId;
  poses: Types.ObjectId[];
  sector?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const palletSchema = new Schema<IPallet>(
  {
    title: { type: String, required: true },
    rowId: { type: Schema.Types.ObjectId, ref: "Row", required: true },
    poses: [{ type: Schema.Types.ObjectId, ref: "Pos" }],
    sector: String,
  },
  { timestamps: true }
);

export { palletSchema };

/**
 * Pallet Mongoose model
 * @see IPallet
 */
export const Pallet = model<IPallet>("Pallet", palletSchema);
