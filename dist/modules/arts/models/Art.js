import mongoose, { Schema } from "mongoose";
// Схема для btradeStock
const btradeStockSchema = new Schema({
    value: { type: Number, required: true },
    date: { type: Date, default: Date.now },
}, { _id: false });
// Схема для Art
const artSchema = new Schema({
    artikul: {
        type: String,
        required: true,
        unique: true,
    },
    nameukr: { type: String },
    namerus: { type: String },
    zone: {
        type: String,
        required: true,
    },
    limit: { type: Number },
    marker: { type: String },
    btradeStock: { type: btradeStockSchema },
}, { timestamps: true });
/**
 * Art Mongoose model
 * @see IArt
 */
export const Art = mongoose.model("Art", artSchema);
