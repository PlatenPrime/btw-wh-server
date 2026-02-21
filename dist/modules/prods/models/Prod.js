import mongoose, { Schema } from "mongoose";
const prodSchema = new Schema({
    name: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
}, { timestamps: true });
/**
 * Prod Mongoose model
 * @see IProd
 */
export const Prod = mongoose.model("Prod", prodSchema, "prods");
