import mongoose, { Document, Model, Schema } from "mongoose";

/**
 * Запрос доставить товар к кассе (kasa + asks).
 * Обязательные при создании: artikul, nameukr, zone.
 * quant и com — опциональны.
 */
export interface IKask extends Document {
  artikul: string;
  nameukr: string;
  quant?: number;
  zone: string;
  com?: string;
  createdAt: Date;
  updatedAt: Date;
}

const kaskSchema = new Schema<IKask>(
  {
    artikul: { type: String, required: true },
    nameukr: { type: String, required: true },
    quant: { type: Number, required: false },
    zone: { type: String, required: true },
    com: { type: String, required: false },
  },
  { timestamps: true }
);

export const Kask: Model<IKask> = mongoose.model<IKask>("Kask", kaskSchema);
