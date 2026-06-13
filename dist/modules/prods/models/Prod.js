import { Schema } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";
const prodSchema = new Schema({
    name: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
}, { timestamps: true });
/**
 * Prod Mongoose model
 * @see IProd
 */
export const Prod = getOrCreateModel("Prod", prodSchema, "prods");
