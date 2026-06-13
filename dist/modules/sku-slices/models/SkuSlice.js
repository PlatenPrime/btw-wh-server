import { Schema } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";
const skuSliceSchema = new Schema({
    konkName: { type: String, required: true },
    date: { type: Date, required: true },
    data: {
        type: Schema.Types.Mixed,
        default: {},
    },
}, { timestamps: true });
skuSliceSchema.index({ konkName: 1, date: 1 }, { unique: true });
export const SkuSlice = getOrCreateModel("SkuSlice", skuSliceSchema, "sku_slices");
