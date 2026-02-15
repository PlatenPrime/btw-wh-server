import mongoose, { Document, Model, Schema, Types } from "mongoose";

/**
 * Объект артикулов поставки: ключ — артикул (как в Art, Def, Pos), значение — число (например количество)
 */
export interface IDelArtikuls {
  [artikul: string]: number;
}

/**
 * Интерфейс документа поставки
 */
export interface IDel extends Document {
  _id: Types.ObjectId;
  title: string;
  artikuls: IDelArtikuls;
  createdAt: Date;
  updatedAt: Date;
}

const delArtikulsSchema = new Schema<IDelArtikuls>(
  {},
  {
    _id: false,
    strict: false,
  }
);

const delSchema = new Schema<IDel>(
  {
    title: { type: String, required: true },
    artikuls: {
      type: delArtikulsSchema,
      required: true,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

/**
 * Del Mongoose model
 * @see IDel
 */
export const Del: Model<IDel> = mongoose.model<IDel>("Del", delSchema, "dels");
