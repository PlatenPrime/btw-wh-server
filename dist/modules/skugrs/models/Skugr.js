import { Schema } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";
const skugrSchema = new Schema({
    konkName: { type: String, required: true },
    prodName: { type: String, required: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    isSliced: { type: Boolean, required: true, default: true },
    skus: [
        {
            type: Schema.Types.ObjectId,
            ref: "Sku",
            required: true,
        },
    ],
}, { timestamps: true });
skugrSchema.index({ konkName: 1, prodName: 1 });
export const Skugr = getOrCreateModel("Skugr", skugrSchema, "skugrs");
