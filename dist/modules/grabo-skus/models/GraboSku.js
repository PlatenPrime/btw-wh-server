import { Schema } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";
function emptyStringField() {
    return { type: String, default: "" };
}
const graboSkuSchema = new Schema({
    title: emptyStringField(),
    productId: { type: String, required: true, unique: true },
    isNewProduct: { type: Boolean, required: true, default: false },
    color: emptyStringField(),
    size: emptyStringField(),
    material: emptyStringField(),
    gas: emptyStringField(),
    language: emptyStringField(),
    gasCapacity: emptyStringField(),
    tags: { type: [String], default: () => [] },
    images: { type: [String], default: () => [] },
    url: { type: String, required: true },
    isOnSite: { type: Boolean, required: true, default: true },
    lastSeenAt: { type: Date, required: true },
}, { timestamps: true });
graboSkuSchema.index({ isOnSite: 1 });
graboSkuSchema.index({ url: 1 });
graboSkuSchema.index({ tags: 1 });
export const GraboSku = getOrCreateModel("GraboSku", graboSkuSchema, "graboskus");
