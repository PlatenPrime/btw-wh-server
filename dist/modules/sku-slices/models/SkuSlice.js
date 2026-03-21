import mongoose, { Schema } from "mongoose";
const skuSliceSchema = new Schema({
    konkName: { type: String, required: true },
    date: { type: Date, required: true },
    data: {
        type: Schema.Types.Mixed,
        default: {},
    },
}, { timestamps: true });
skuSliceSchema.index({ konkName: 1, date: 1 }, { unique: true });
export const SkuSlice = mongoose.model("SkuSlice", skuSliceSchema, "sku_slices");
