import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { IUser } from "../../auth/models/User.js";

type AskUserData = Pick<IUser, "_id" | "fullname" | "telegram" | "photo">;
export type AskStatus = "new"  | "completed" | "rejected";
export const validAskStatuses: AskStatus[] = ["new",  "completed", "rejected"];

export interface IAsk extends Document {
  artikul: string;
  nameukr?: string;
  quant?: number;
  com?: string;
  asker: Types.ObjectId;
  askerData: AskUserData;
  solver: Types.ObjectId;
  solverData?: AskUserData;
  status: AskStatus;
  actions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const askUserDataSchema = new Schema<AskUserData>(
  {
    _id: { type: Schema.Types.ObjectId, required: true },
    fullname: { type: String, required: true },
    telegram: { type: String },
    photo: { type: String },
  },
  { _id: false }
);

const askSchema = new Schema<IAsk>(
  {
    artikul: { type: String, required: true },
    nameukr: { type: String },
    quant: { type: Number },
    com: { type: String },
    asker: { type: Schema.Types.ObjectId, ref: "User", required: true },
    solver: { type: Schema.Types.ObjectId, ref: "User" },
    askerData: { type: askUserDataSchema, required: true },
    solverData: { type: askUserDataSchema },
    status: {
      type: String,
      enum: ["new", "completed", "rejected"],
      default: "new",
    },
    actions: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Ask: Model<IAsk> = mongoose.model<IAsk>("Ask", askSchema);
