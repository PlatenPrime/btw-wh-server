import mongoose, { Schema } from "mongoose";
const analogSchema = new Schema({
    konkName: { type: String, required: true },
    prodName: { type: String, required: true },
    artikul: { type: String, default: "" },
    nameukr: { type: String },
    url: { type: String, required: true },
    title: { type: String },
    imageUrl: { type: String },
}, { timestamps: true });
/**
 * Analog Mongoose model
 * @see IAnalog
 */
export const Analog = mongoose.model("Analog", analogSchema, "analogs");
