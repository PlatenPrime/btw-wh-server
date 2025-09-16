import mongoose, { Schema } from "mongoose";
export const validAskStatuses = ["new", "completed", "rejected"];
const askUserDataSchema = new Schema({
    _id: { type: Schema.Types.ObjectId, required: true },
    fullname: { type: String, required: true },
    telegram: { type: String },
    photo: { type: String },
}, { _id: false });
const askSchema = new Schema({
    artikul: { type: String, required: true },
    nameukr: { type: String },
    quant: { type: Number },
    com: { type: String },
    asker: { type: Schema.Types.ObjectId, ref: "User", required: true },
    solver: { type: Schema.Types.ObjectId, ref: "User" },
    askerData: { type: askUserDataSchema, required: true },
    solverData: { type: askUserDataSchema },
    status: {
        type: String,
        enum: ["new", "completed", "rejected"],
        default: "new",
    },
    actions: { type: [String], default: [] },
}, { timestamps: true });
export const Ask = mongoose.model("Ask", askSchema);
