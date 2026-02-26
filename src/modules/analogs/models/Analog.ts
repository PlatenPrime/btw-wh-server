import mongoose, { Document, Model, Schema, Types } from "mongoose";

/**
 * Интерфейс документа аналога (аналог артикула у конкурента)
 */
export interface IAnalog extends Document {
  _id: Types.ObjectId;
  konkName: string;
  prodName: string;
  artikul: string;
  nameukr?: string;
  url: string;
  title?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const analogSchema = new Schema<IAnalog>(
  {
    konkName: { type: String, required: true },
    prodName: { type: String, required: true },
    artikul: { type: String, default: "" },
    nameukr: { type: String },
    url: { type: String, required: true },
    title: { type: String },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

/**
 * Analog Mongoose model
 * @see IAnalog
 */
export const Analog: Model<IAnalog> = mongoose.model<IAnalog>(
  "Analog",
  analogSchema,
  "analogs"
);
