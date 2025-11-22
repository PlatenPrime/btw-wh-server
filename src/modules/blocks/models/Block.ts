import mongoose, { Document, Model, Schema, Types } from "mongoose";

// Интерфейс для Block
export interface IBlock extends Document {
  _id: Types.ObjectId;
  title: string; // Название блока (уникальное)
  order: number; // Позиция в общем списке блоков (для расчета секторов)
  createdAt: Date;
  updatedAt: Date;
}

// Схема для Block
const blockSchema = new Schema<IBlock>(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    order: {
      type: Number,
      required: true,
      min: [1, "Order must be at least 1"],
    },
  },
  { timestamps: true }
);

// Индексы для оптимизации
blockSchema.index({ order: 1 }); // Для сортировки по order

/**
 * Block Mongoose model
 * @see IBlock
 */
export const Block: Model<IBlock> = mongoose.model<IBlock>("Block", blockSchema);

