import mongoose, { Document, Model, ObjectId, Schema } from "mongoose";

export interface IFuser extends Document {
  _id: ObjectId | string;
  clerkUserId: string;
  username: string;
  email: string;
  fuserImg: string;
  savedFounds: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const FuserSchema: Schema<IFuser> = new Schema(
  {
    clerkUserId: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    fuserImg: { type: String },
    savedFounds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Found" }],
      default: [],
    },
  },
  { timestamps: true }
);

const Fuser: Model<IFuser> = mongoose.model<IFuser>("Fuser", FuserSchema);
export default Fuser;
