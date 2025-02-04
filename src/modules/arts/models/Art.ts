import mongoose, { Document, Schema } from "mongoose";

// Интерфейс для btradeStock
interface IBtradeStock {
  value: number;
  date: Date;
}

// Интерфейс для Art
export interface IArt extends Document {
  artikul: string;
  nameukr?: string;
  namerus?: string;
  zone: string;
  limit?: number;
  marker?: string;
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
const ArtSchema = new Schema<IArt>(
  {
    artikul: {
      type: String,
      required: true,
      unique: true,
    },
    nameukr: String,
    namerus: String,
    zone: {
      type: String,
      required: true,
    },
    limit: Number,
    marker: String,
    btradeStock: btradeStockSchema,
  },
  { timestamps: true }
);

// Экспорт модели
export default mongoose.model<IArt>("Art", ArtSchema);

