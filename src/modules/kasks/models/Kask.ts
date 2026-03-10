import mongoose, { Document, Model, Schema } from "mongoose";

/**
 * Запрос доставить товар к кассе (kasa + asks).
 * Все поля задаются клиентом при создании.
 */
export interface IKask extends Document {
  artikul: string;
  nameukr: string;
  quant: number;
  zone: string;
  com: string;
  createdAt: Date;
  updatedAt: Date;
}

const kaskSchema = new Schema<IKask>(
  {
    artikul: { type: String, required: true },
    nameukr: { type: String, required: true },
    quant: { type: Number, required: true },
    zone: { type: String, required: true },
    com: { type: String, required: true },
  },
  { timestamps: true }
);

export const Kask: Model<IKask> = mongoose.model<IKask>("Kask", kaskSchema);
