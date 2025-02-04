import mongoose, { Schema } from "mongoose";
// Схема для btradeStock
const btradeStockSchema = new Schema({
    value: { type: Number, required: true },
    date: { type: Date, default: Date.now },
}, { _id: false });
// Схема для Art
const ArtSchema = new Schema({
    artikul: {
        type: String,
        required: true,
        unique: true,
    },
    nameukr: String,
    namerus: String,
    zone: {
        type: String,
        required: true,
    },
    limit: Number,
    marker: String,
    btradeStock: btradeStockSchema,
}, { timestamps: true });
// Экспорт модели
export default mongoose.model("Art", ArtSchema);
