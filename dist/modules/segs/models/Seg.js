import { model, Schema } from "mongoose";
const blockSubdocumentSchema = new Schema({
    _id: { type: Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
}, { _id: false });
const zoneSubdocumentSchema = new Schema({
    _id: { type: Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
}, { _id: false });
const segSchema = new Schema({
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
}, { timestamps: true });
// Индексы для оптимизации
segSchema.index({ block: 1, order: 1 }); // Для сортировки сегментов в блоке
segSchema.index({ block: 1 }); // Для поиска сегментов по блоку
export { segSchema };
/**
 * Seg Mongoose model
 * @see ISeg
 */
export const Seg = model("Seg", segSchema);
