import mongoose, { Document, Model, Schema } from "mongoose";

// Интерфейс для Zone
export interface IZone extends Document {
  _id: mongoose.Types.ObjectId;
  title: string; // "42-5-2" (row-rack-shelf)
  bar: number; // 420502 (for Code-128 barcode)
  sector: number; // 0 (default, calculated later by separate service)
  createdAt: Date;
  updatedAt: Date;
}

// Схема для Zone
const zoneSchema = new Schema<IZone>(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (v: string) {
          // Pattern: 1-3 numeric segments separated by dashes
          // Each segment: 1-2 digits (1-99)
          return /^\d{1,2}(-\d{1,2}){0,2}$/.test(v);
        },
        message:
          'Title must be in format: 1-3 numeric segments (e.g., "42-1", "22-5-1", "42-13-2")',
      },
    },
    bar: {
      type: Number,
      required: true,
      unique: true,
      min: [1, "Bar must be a positive number"],
    },
    sector: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Sector must be non-negative"],
    },
  },
  { timestamps: true }
);

// Индексы для оптимизации поиска (уникальные поля уже имеют индексы)

/**
 * Zone Mongoose model
 * @see IZone
 */
export const Zone: Model<IZone> = mongoose.model<IZone>("Zone", zoneSchema);
