import mongoose, { Schema } from "mongoose";
export const validAskStatuses = ["new", "completed", "rejected"];
const askUserDataSchema = new Schema({
    _id: { type: Schema.Types.ObjectId, required: true },
    fullname: { type: String, required: true },
    telegram: { type: String },
    photo: { type: String },
}, { _id: false });
const askEventPalletDataSchema = new Schema({
    _id: { type: Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
}, { _id: false });
const askEventPullDetailsSchema = new Schema({
    palletData: { type: askEventPalletDataSchema, required: true },
    quant: { type: Number, required: true },
    boxes: { type: Number, required: true },
}, { _id: false });
const askEventSchema = new Schema({
    eventName: {
        type: String,
        enum: ["complete", "reject", "pull"],
        required: true,
    },
    solverData: { type: askUserDataSchema },
    date: { type: Date, required: true },
    details: { type: askEventPullDetailsSchema },
}, { _id: false });
askEventSchema.path("details").validate({
    validator: function (details) {
        if (this.eventName === "pull") {
            return Boolean(details);
        }
        return details === undefined;
    },
    message: "details must be provided only for pull events",
});
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
    pullQuant: { type: Number, default: 0 },
    events: { type: [askEventSchema], default: [] },
}, { timestamps: true });
export const Ask = mongoose.model("Ask", askSchema);
