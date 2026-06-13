import { Schema } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";
const analogSchema = new Schema({
    konkName: { type: String, required: true },
    prodName: { type: String, required: true },
    artikul: { type: String, default: "" },
    nameukr: { type: String },
    url: { type: String, required: true, unique: true },
}, { timestamps: true });
/**
 * Analog Mongoose model
 * @see IAnalog
 */
export const Analog = getOrCreateModel("Analog", analogSchema, "analogs");
