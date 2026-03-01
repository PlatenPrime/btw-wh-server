import mongoose, { Schema } from "mongoose";
const analogSliceSchema = new Schema({
    konkName: { type: String, required: true },
    date: { type: Date, required: true },
    data: {
        type: Schema.Types.Mixed,
        default: {},
    },
}, { timestamps: true });
analogSliceSchema.index({ konkName: 1, date: 1 }, { unique: true });
export const AnalogSlice = mongoose.model("AnalogSlice", analogSliceSchema, "analog_slices");
