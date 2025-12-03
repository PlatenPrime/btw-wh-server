import mongoose, { Schema } from "mongoose";
export const validAskStatuses = [
    "new",
    "processing",
    "completed",
    "rejected",
];
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
        enum: ["create", "complete", "reject", "pull"],
        required: true,
    },
    userData: { type: askUserDataSchema, required: true },
    date: { type: Date, required: true },
    pullDetails: { type: askEventPullDetailsSchema },
}, { _id: false });
askEventSchema.path("pullDetails").validate({
    validator: function (pullDetails) {
        if (this.eventName === "pull") {
            return Boolean(pullDetails);
        }
        return pullDetails === undefined;
    },
    message: "pullDetails must be provided only for pull events",
});
const askSchema = new Schema({
    artikul: { type: String, required: true },
    nameukr: { type: String },
    quant: { type: Number },
    com: { type: String },
    sklad: { type: String, default: "pogrebi" },
    asker: { type: Schema.Types.ObjectId, ref: "User", required: true },
    solver: { type: Schema.Types.ObjectId, ref: "User" },
    askerData: { type: askUserDataSchema, required: true },
    solverData: { type: askUserDataSchema },
    status: {
        type: String,
        enum: ["new", "processing", "completed", "rejected"],
        default: "new",
    },
    actions: { type: [String], default: [] },
    pullQuant: { type: Number, default: 0 },
    pullBox: { type: Number, default: 0 },
    events: { type: [askEventSchema], default: [] },
}, { timestamps: true });
export const Ask = mongoose.model("Ask", askSchema);
