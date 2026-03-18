import mongoose, { Schema } from "mongoose";
const varGroupSchema = new Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
}, { _id: false });
const variantSchema = new Schema({
    konkName: { type: String, required: true },
    prodName: { type: String, required: true },
    title: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    varGroup: { type: varGroupSchema, required: false },
    imageUrl: { type: String, required: true },
}, { timestamps: true });
export const Variant = mongoose.model("Variant", variantSchema, "variants");
