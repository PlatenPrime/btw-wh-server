import { Document, Model, Schema, Types } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";
export interface IRole extends Document {
  _id: Types.ObjectId;
  value: string;
  name?: string;
}

const RoleSchema: Schema<IRole> = new Schema({
  value: { type: String, unique: true, default: "USER" },
  name: { type: String },
});

const Role: Model<IRole> = getOrCreateModel<IRole>("Role", RoleSchema);

export default Role;
