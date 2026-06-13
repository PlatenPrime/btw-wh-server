import { Document, Model, Schema, Types } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";

// Интерфейс для btradeStock
export interface IBtradeStock {
  value: number;
  date: Date;
}

// Интерфейс для Art
export interface IArt extends Document {
  _id: Types.ObjectId;
  artikul: string;
  prodName?: string;
  nameukr?: string;
  namerus?: string;
  zone: string;
  limit?: number;
  marker?: string;
  abc?: string;
  btradeStock?: IBtradeStock;
  createdAt?: Date;
  updatedAt?: Date;
}

// Схема для btradeStock
const btradeStockSchema = new Schema<IBtradeStock>(
  {
    value: { type: Number, required: true },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Схема для Art
const artSchema = new Schema<IArt>(
  {
    artikul: {
      type: String,
      required: true,
      unique: true,
    },
    prodName: { type: String },
    nameukr: { type: String },
    namerus: { type: String },
    zone: {
      type: String,
      required: true,
    },
    limit: { type: Number },
    marker: { type: String },
    abc: { type: String },
    btradeStock: { type: btradeStockSchema },
  },
  { timestamps: true }
);

/**
 * Art Mongoose model
 * @see IArt
 */
export const Art: Model<IArt> = getOrCreateModel<IArt>("Art", artSchema);
