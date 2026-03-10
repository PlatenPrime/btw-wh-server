import mongoose, { Schema } from "mongoose";
const kaskSchema = new Schema({
    artikul: { type: String, required: true },
    nameukr: { type: String, required: true },
    quant: { type: Number, required: true },
    zone: { type: String, required: true },
    com: { type: String, required: true },
}, { timestamps: true });
export const Kask = mongoose.model("Kask", kaskSchema);
