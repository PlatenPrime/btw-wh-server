import { Schema } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";
const btradeSliceSchema = new Schema({
    date: { type: Date, required: true, unique: true },
    data: {
        type: Schema.Types.Mixed,
        default: {},
    },
}, { timestamps: true });
export const BtradeSlice = getOrCreateModel("BtradeSlice", btradeSliceSchema, "btrade_slices");
