import mongoose, { Schema } from "mongoose";
const skuSchema = new Schema({
    konkName: { type: String, required: true },
    prodName: { type: String, required: true },
    productId: { type: String, required: true, unique: true },
    btradeAnalog: { type: String, default: "" },
    title: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    imageUrl: { type: String, default: "" },
    isInvalid: { type: Boolean, default: false },
}, { timestamps: true });
skuSchema.index({ konkName: 1, isInvalid: 1 });
/**
 * Sku Mongoose model
 * @see ISku
 */
export const Sku = mongoose.model("Sku", skuSchema, "skus");
