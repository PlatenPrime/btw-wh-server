import mongoose, { Schema } from "mongoose";
const skugrSchema = new Schema({
    konkName: { type: String, required: true },
    prodName: { type: String, required: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    skus: [
        {
            type: Schema.Types.ObjectId,
            ref: "Sku",
            required: true,
        },
    ],
}, { timestamps: true });
skugrSchema.index({ konkName: 1, prodName: 1 });
export const Skugr = mongoose.model("Skugr", skugrSchema, "skugrs");
