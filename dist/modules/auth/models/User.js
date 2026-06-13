import { Schema } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";
const UserSchema = new Schema({
    username: { type: String, required: true, unique: true },
    fullname: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, ref: "Role" },
    telegram: { type: String },
    photo: { type: String },
}, { timestamps: true });
const User = getOrCreateModel("User", UserSchema);
export default User;
