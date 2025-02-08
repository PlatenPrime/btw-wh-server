import mongoose, { Schema } from "mongoose";
const UserSchema = new Schema({
    username: { type: String, required: true, unique: true },
    fullname: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, ref: "Role" },
    telegram: { type: String },
    photo: { type: String },
}, { timestamps: true });
const User = mongoose.model("User", UserSchema);
export default User;
