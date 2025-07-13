// models/Pos.ts
import { Document, model, Schema, Types } from "mongoose";

/**
 * Pallet subdocument interface for Pos
 */
interface IPalletSubdocument {
  _id: Types.ObjectId;
  title: string;
  sector?: string;
}

/**
 * Row subdocument interface for Pos
 */
interface IRowSubdocument {
  _id: Types.ObjectId;
  title: string;
}

/**
 * Pos document interface
 * All position data fields (palletTitle, rowTitle, artikul, quant, boxes) are required
 * to ensure data integrity and prevent incomplete position records.
 */
export interface IPos extends Document {
  pallet: IPalletSubdocument;
  row: IRowSubdocument;
  palletTitle: string; // Required: Cached pallet title for performance
  rowTitle: string; // Required: Cached row title for performance
  artikul: string; // Required: Article number/identifier
  quant: number; // Required: Quantity of items
  boxes: number; // Required: Number of boxes
  date?: string; // Optional: Date information
  sklad?: string; // Optional: Warehouse identifier
  createdAt?: Date; // Auto-generated timestamp
  updatedAt?: Date; // Auto-generated timestamp
}

const palletSubdocumentSchema = new Schema<IPalletSubdocument>(
  {
    _id: { type: Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
    sector: String,
  },
  { _id: false }
);

const rowSubdocumentSchema = new Schema<IRowSubdocument>(
  {
    _id: { type: Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
  },
  { _id: false }
);

const posSchema = new Schema<IPos>(
  {
    pallet: { type: palletSubdocumentSchema, required: true },
    row: { type: rowSubdocumentSchema, required: true },
    palletTitle: { type: String, required: true }, // Required for data integrity
    rowTitle: { type: String, required: true }, // Required for data integrity
    artikul: { type: String, required: true }, // Required for data integrity
    quant: { type: Number, required: true }, // Required for data integrity
    boxes: { type: Number, required: true }, // Required for data integrity
    date: String, // Optional date information
    sklad: String, // Optional warehouse identifier
  },
  { timestamps: true }
);

/**
 * Pos Mongoose model
 * @see IPos
 */
export const Pos = model<IPos>("Pos", posSchema);
