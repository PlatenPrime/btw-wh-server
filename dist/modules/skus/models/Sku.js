import mongoose, { Schema } from "mongoose";
const skuSchema = new Schema({
    konkName: { type: String, required: true },
    prodName: { type: String, required: true },
    btradeAnalog: { type: String, default: "" },
    title: { type: String, required: true },
    url: { type: String, required: true, unique: true },
}, { timestamps: true });
/**
 * Sku Mongoose model
 * @see ISku
 */
export const Sku = mongoose.model("Sku", skuSchema, "skus");
