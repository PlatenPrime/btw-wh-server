import mongoose, { Document, Model, ObjectId, Schema } from "mongoose";

export interface IFound extends Document {
  _id: ObjectId | string;
  fuser: ObjectId | string;
  coverImg: string;
  title: string;
  slug: string;
  desc: string;
  content: string;
  isFeatured: boolean;
  visits: number;

  createdAt: Date;
  updatedAt: Date;
}

const FoundSchema: Schema<IFound> = new Schema(
  {
    fuser: { type: Schema.Types.ObjectId, ref: "Fuser", required: true },
    coverImg: { type: String },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    desc: { type: String },
    content: { type: String, required: true },
    isFeatured: { type: Boolean, default: false },
    visits: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Found: Model<IFound> = mongoose.model<IFound>("Found", FoundSchema);
export default Found;
