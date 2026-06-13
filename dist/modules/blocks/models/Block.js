import { Schema } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";
// Схема для Block
const blockSchema = new Schema({
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
    segs: [{ type: Schema.Types.ObjectId, ref: "Seg" }],
}, { timestamps: true });
// Индексы для оптимизации
blockSchema.index({ order: 1 }); // Для сортировки по order
/**
 * Block Mongoose model
 * @see IBlock
 */
export const Block = getOrCreateModel("Block", blockSchema);
