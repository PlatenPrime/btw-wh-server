import mongoose, { Schema } from "mongoose";
const konkSchema = new Schema({
    name: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    imageUrl: { type: String, required: true },
}, { timestamps: true });
/**
 * Konk Mongoose model
 * @see IKonk
 */
export const Konk = mongoose.model("Konk", konkSchema, "konks");
