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
 * Pallet group subdocument interface for Pallet
 */
interface IPalletGroupSubdocument {
  id: Types.ObjectId;
  title: string;
}

/**
 * Pallet document interface
 */
export interface IPallet extends Document {
  _id: Types.ObjectId;
  title: string;
  row: Types.ObjectId;
  rowData: IRowSubdocument;
  poses: Types.ObjectId[];
  isDef: boolean;
  sector: number;
  palgr?: IPalletGroupSubdocument;
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

const palletGroupSubdocumentSchema = new Schema<IPalletGroupSubdocument>(
  {
    id: { type: Schema.Types.ObjectId, ref: "PalletGroup" },
    title: { type: String, required: true },
  },
  { _id: false }
);

const palletSchema = new Schema<IPallet>(
  {
    title: { type: String, required: true, unique: true },
    rowData: { type: rowSubdocumentSchema, required: true },
    row: { type: Schema.Types.ObjectId, required: true },
    poses: [{ type: Schema.Types.ObjectId, ref: "Pos" }],
    isDef: { type: Boolean, default: false },
    sector: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Sector must be non-negative"],
    },
    palgr: { type: palletGroupSubdocumentSchema, required: false },
  },
  { timestamps: true }
);

export { palletSchema };

/**
 * Pallet Mongoose model
 * @see IPallet
 */
export const Pallet = model<IPallet>("Pallet", palletSchema);
