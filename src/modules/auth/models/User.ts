import { Document, Model, Schema, Types } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  fullname: string;
  password: string;
  role?: string;
  telegram?: string;
  photo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    username: { type: String, required: true, unique: true },
    fullname: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, ref: "Role" },
    telegram: { type: String },
    photo: { type: String },
  },
  { timestamps: true }
);

const User: Model<IUser> = getOrCreateModel<IUser>("User", UserSchema);
export default User;
