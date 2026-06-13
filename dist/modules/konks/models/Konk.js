import { Schema } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";
const konkSchema = new Schema({
    name: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    imageUrl: { type: String, required: true },
    recountDays: { type: [String], required: true, default: [] },
}, { timestamps: true });
/**
 * Konk Mongoose model
 * @see IKonk
 */
export const Konk = getOrCreateModel("Konk", konkSchema, "konks");
