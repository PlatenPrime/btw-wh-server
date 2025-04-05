import mongoose, { Schema } from "mongoose";
const FoundSchema = new Schema({
    fuser: { type: Schema.Types.ObjectId, ref: "Fuser", required: true },
    coverImg: { type: String },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    desc: { type: String },
    content: { type: String, required: true },
    isFeatured: { type: Boolean, default: false },
    visits: { type: Number, default: 0 },
}, { timestamps: true });
const Found = mongoose.model("Found", FoundSchema);
export default Found;
