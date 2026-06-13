import { Schema } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";
const RoleSchema = new Schema({
    value: { type: String, unique: true, default: "USER" },
    name: { type: String },
});
const Role = getOrCreateModel("Role", RoleSchema);
export default Role;
