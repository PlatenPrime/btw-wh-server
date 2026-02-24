import mongoose, { Document, Model, Schema, Types } from "mongoose";

/**
 * Интерфейс документа константы (пользовательская коллекция ключ-значение)
 */
export interface IConstant extends Document {
  _id: Types.ObjectId;
  name: string;
  title: string;
  data: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const constantSchema = new Schema<IConstant>(
  {
    name: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    data: {
      type: Schema.Types.Mixed,
      default: () => ({}),
      validate: {
        validator(value: unknown) {
          if (value === null || value === undefined) return true;
          if (typeof value !== "object" || Array.isArray(value)) return false;
          return Object.values(value).every((v) => typeof v === "string");
        },
        message: "data must be an object with string values",
      },
    },
  },
  { timestamps: true }
);

/**
 * Constant Mongoose model
 * @see IConstant
 */
export const Constant: Model<IConstant> = mongoose.model<IConstant>(
  "Constant",
  constantSchema,
  "constants"
);
