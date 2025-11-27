import { Document, model, Schema, Types } from "mongoose";

/**
 * Block subdocument interface for Seg
 */
interface IBlockSubdocument {
  _id: Types.ObjectId;
  title: string;
}

/**
 * Zone subdocument interface for Seg
 */
export interface IZoneSubdocument {
  _id: Types.ObjectId;
  title: string;
}

/**
 * Seg document interface
 */
export interface ISeg extends Document {
  _id: Types.ObjectId;
  block: Types.ObjectId;
  blockData: IBlockSubdocument;
  sector: number;
  order: number;
  zones: IZoneSubdocument[];
  createdAt?: Date;
  updatedAt?: Date;
}

const blockSubdocumentSchema = new Schema<IBlockSubdocument>(
  {
    _id: { type: Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
  },
  { _id: false }
);

const zoneSubdocumentSchema = new Schema<IZoneSubdocument>(
  {
    _id: { type: Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
  },
  { _id: false }
);

const segSchema = new Schema<ISeg>(
  {
    block: { type: Schema.Types.ObjectId, required: true, ref: "Block" },
    blockData: { type: blockSubdocumentSchema, required: true },
    sector: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Sector must be non-negative"],
    },
    order: {
      type: Number,
      required: true,
      min: [1, "Order must be at least 1"],
    },
    zones: [zoneSubdocumentSchema],
  },
  { timestamps: true }
);

// Индексы для оптимизации
segSchema.index({ block: 1, order: 1 }); // Для сортировки сегментов в блоке
segSchema.index({ block: 1 }); // Для поиска сегментов по блоку

export { segSchema };

/**
 * Seg Mongoose model
 * @see ISeg
 */
export const Seg = model<ISeg>("Seg", segSchema);
