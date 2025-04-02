import mongoose, { Document, Model, ObjectId, Schema } from "mongoose";

export interface IFcomment extends Document {
  _id: ObjectId | string;
  fuser: ObjectId | string;
  found: ObjectId | string;
  desc: string;

}

const FcommentSchema: Schema<IFcomment> = new Schema(
  {
    fuser: { type: Schema.Types.ObjectId, ref: "Fuser", required: true },
    found: { type: Schema.Types.ObjectId, ref: "Found", required: true },
   desc : { type: String, required: true },
  },
  { timestamps: true }
);

const Fcomment: Model<IFcomment> = mongoose.model<IFcomment>("Fcomment", FcommentSchema);
export default Fcomment;
