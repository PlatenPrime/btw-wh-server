import mongoose, { Document, Model, Schema, Types } from "mongoose";

/**
 * Интерфейс документа конкурента
 */
export interface IKonk extends Document {
  _id: Types.ObjectId;
  name: string;
  title: string;
  url: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const konkSchema = new Schema<IKonk>(
  {
    name: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    imageUrl: { type: String, required: true },
  },
  { timestamps: true }
);

/**
 * Konk Mongoose model
 * @see IKonk
 */
export const Konk: Model<IKonk> = mongoose.model<IKonk>(
  "Konk",
  konkSchema,
  "konks"
);
