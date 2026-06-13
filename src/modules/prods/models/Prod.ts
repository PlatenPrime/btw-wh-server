import { Document, Model, Schema, Types } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";

/**
 * Интерфейс документа производителя
 */
export interface IProd extends Document {
  _id: Types.ObjectId;
  name: string;
  title: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const prodSchema = new Schema<IProd>(
  {
    name: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
  },
  { timestamps: true }
);

/**
 * Prod Mongoose model
 * @see IProd
 */
export const Prod: Model<IProd> = getOrCreateModel<IProd>(
  "Prod",
  prodSchema,
  "prods",
);
