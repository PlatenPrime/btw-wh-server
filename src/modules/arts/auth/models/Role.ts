import mongoose, { Document, Model, Schema } from "mongoose";

export interface IRole extends Document {
  value: string;
  name?: string;
}

const RoleSchema: Schema<IRole> = new Schema({
  value: { type: String, unique: true, default: "USER" },
  name: { type: String },
});

const Role: Model<IRole> = mongoose.model<IRole>("Role", RoleSchema);

export default Role;
