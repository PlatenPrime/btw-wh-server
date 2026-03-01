import mongoose, { Schema } from "mongoose";
const btradeSliceSchema = new Schema({
    date: { type: Date, required: true, unique: true },
    data: {
        type: Schema.Types.Mixed,
        default: {},
    },
}, { timestamps: true });
export const BtradeSlice = mongoose.model("BtradeSlice", btradeSliceSchema, "btrade_slices");
