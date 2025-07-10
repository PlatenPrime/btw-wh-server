// models/Pos.ts
import { Document, model, Schema, Types } from "mongoose";

/**
 * Pos document interface
 */
export interface IPos extends Document {
  palletId: Types.ObjectId;
  rowId: Types.ObjectId;
  palletTitle?: string;
  rowTitle?: string;
  artikul?: string;
  quant?: number;
  boxes?: number;
  date?: string;
  sklad?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const posSchema = new Schema<IPos>(
  {
    palletId: { type: Schema.Types.ObjectId, ref: "Pallet", required: true },
    rowId: { type: Schema.Types.ObjectId, ref: "Row", required: true },
    palletTitle: String,
    rowTitle: String,
    artikul: String,
    quant: Number,
    boxes: Number,
    date: String,
    sklad: String,
  },
  { timestamps: true }
);

/**
 * Pos Mongoose model
 * @see IPos
 */
export const Pos = model<IPos>("Pos", posSchema);
