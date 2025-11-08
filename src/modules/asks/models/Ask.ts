import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { IUser } from "../../auth/models/User.js";

export type AskUserData = Pick<
  IUser,
  "_id" | "fullname" | "telegram" | "photo"
>;
export type AskStatus = "new" | "completed" | "rejected";
export const validAskStatuses: AskStatus[] = ["new", "completed", "rejected"];

export type AskEventName = "create" | "complete" | "reject" | "pull";

export interface AskEventPalletData {
  _id: Types.ObjectId;
  title: string;
  sector?: string;
  isDef?: boolean;
}

export interface AskEventPullDetails {
  palletData: AskEventPalletData;
  quant: number;
  boxes: number;
}

export interface AskEvent {
  eventName: AskEventName;
  userData: AskUserData;
  date: Date;
  pullDetails?: AskEventPullDetails;
}

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
  pullQuant: number;
  pullBox: number;
  events: AskEvent[];
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

const askEventPalletDataSchema = new Schema<AskEventPalletData>(
  {
    _id: { type: Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
    sector: { type: String },
    isDef: { type: Boolean },
  },
  { _id: false }
);

const askEventPullDetailsSchema = new Schema<AskEventPullDetails>(
  {
    palletData: { type: askEventPalletDataSchema, required: true },
    quant: { type: Number, required: true },
    boxes: { type: Number, required: true },
  },
  { _id: false }
);

const askEventSchema = new Schema<AskEvent>(
  {
    eventName: {
      type: String,
      enum: ["create", "complete", "reject", "pull"],
      required: true,
    },
    userData: { type: askUserDataSchema, required: true },
    date: { type: Date, required: true },
    pullDetails: { type: askEventPullDetailsSchema },
  },
  { _id: false }
);

askEventSchema.path("pullDetails").validate({
  validator: function (
    this: AskEvent,
    pullDetails: AskEventPullDetails | undefined
  ): boolean {
    if (this.eventName === "pull") {
      return Boolean(pullDetails);
    }
    return pullDetails === undefined;
  },
  message: "pullDetails must be provided only for pull events",
});

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
    pullQuant: { type: Number, default: 0 },
    pullBox: { type: Number, default: 0 },
    events: { type: [askEventSchema], default: [] },
  },
  { timestamps: true }
);

export const Ask: Model<IAsk> = mongoose.model<IAsk>("Ask", askSchema);
