import mongoose, { Schema } from "mongoose";
const RoleSchema = new Schema({
    value: { type: String, unique: true, default: "USER" },
    name: { type: String },
});
const Role = mongoose.model("Role", RoleSchema);
export default Role;
