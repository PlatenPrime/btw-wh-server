import { Schema } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";
const analogSliceSchema = new Schema({
    konkName: { type: String, required: true },
    date: { type: Date, required: true },
    data: {
        type: Schema.Types.Mixed,
        default: {},
    },
}, { timestamps: true });
analogSliceSchema.index({ konkName: 1, date: 1 }, { unique: true });
export const AnalogSlice = getOrCreateModel("AnalogSlice", analogSliceSchema, "analog_slices");
