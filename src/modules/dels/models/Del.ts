import mongoose, { Document, Model, Schema, Types } from "mongoose";

/**
 * Объект артикулов поставки: ключ — артикул (как в Art, Def, Pos), значение — объект с количеством и опциональным названием (nameukr).
 */
export interface IDelArtikuls {
  [artikul: string]: {
    quantity: number;
    nameukr?: string;
  };
}

/**
 * Вложенные данные производителя в поставке (title и imageUrl из Prod).
 */
export interface IDelProd {
  title: string;
  imageUrl: string;
}

/**
 * Интерфейс документа поставки
 */
export interface IDel extends Document {
  _id: Types.ObjectId;
  title: string;
  prodName: string;
  prod?: IDelProd;
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

const delProdSchema = new Schema<IDelProd>(
  {
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
  },
  { _id: false }
);

const delSchema = new Schema<IDel>(
  {
    title: { type: String, required: true },
    prodName: { type: String, required: true },
    prod: {
      type: delProdSchema,
      required: false,
    },
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
