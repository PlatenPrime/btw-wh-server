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
 */
export interface IPos extends Document {
  pallet: IPalletSubdocument;
  row: IRowSubdocument;
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
