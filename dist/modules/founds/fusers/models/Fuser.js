import mongoose, { Schema } from "mongoose";
const FuserSchema = new Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    fuserImg: { type: String },
    savedFounds: {
        type: [{ type: Schema.Types.ObjectId, ref: "Found" }],
        default: [],
    },
}, { timestamps: true });
const Fuser = mongoose.model("Fuser", FuserSchema);
export default Fuser;
