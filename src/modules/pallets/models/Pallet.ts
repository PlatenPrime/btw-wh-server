// models/Pallet.ts
import { Document, model, Schema, Types } from "mongoose";

/**
 * Row subdocument interface for Pallet
 */
interface IRowSubdocument {
  _id: Types.ObjectId;
  title: string;
}

/**
 * Pallet document interface
 */
export interface IPallet extends Document {
  title: string;
  row: Types.ObjectId;
  rowData: IRowSubdocument;
  poses: Types.ObjectId[];
  sector?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const rowSubdocumentSchema = new Schema<IRowSubdocument>(
  {
    _id: { type: Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
  },
  { _id: false }
);

const palletSchema = new Schema<IPallet>(
  {
    title: { type: String, required: true },
    rowData: { type: rowSubdocumentSchema, required: true },
    row: { type: Schema.Types.ObjectId, required: true },
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
