import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IVarGroup {
  id: string;
  title: string;
}

export interface IVariant extends Document {
  _id: Types.ObjectId;
  konkName: string;
  prodName: string;
  title: string;
  url: string;
  varGroup?: IVarGroup;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const varGroupSchema = new Schema<IVarGroup>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
  },
  { _id: false }
);

const variantSchema = new Schema<IVariant>(
  {
    konkName: { type: String, required: true },
    prodName: { type: String, required: true },
    title: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    varGroup: { type: varGroupSchema, required: false },
    imageUrl: { type: String, required: true },
  },
  { timestamps: true }
);

export const Variant: Model<IVariant> = mongoose.model<IVariant>(
  "Variant",
  variantSchema,
  "variants"
);

