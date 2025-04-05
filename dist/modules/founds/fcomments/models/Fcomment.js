import mongoose, { Schema } from "mongoose";
const FcommentSchema = new Schema({
    fuser: { type: Schema.Types.ObjectId, ref: "Fuser", required: true },
    found: { type: Schema.Types.ObjectId, ref: "Found", required: true },
    desc: { type: String, required: true },
}, { timestamps: true });
const Fcomment = mongoose.model("Fcomment", FcommentSchema);
export default Fcomment;
