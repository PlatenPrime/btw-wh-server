import { Document, Model, Schema, Types } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";
import { IUser } from "../../auth/models/User.js";

export const EVENT_TYPES = ["create", "edit", "delete", "other"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export type EventUserData = Pick<
  IUser,
  "_id" | "fullname" | "telegram" | "photo"
>;

export interface IEvent extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  userData: EventUserData;
  department: string;
  type: EventType;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const eventUserDataSchema = new Schema<EventUserData>(
  {
    _id: { type: Schema.Types.ObjectId, required: true },
    fullname: { type: String, required: true },
    telegram: { type: String },
    photo: { type: String },
  },
  { _id: false }
);

const eventSchema = new Schema<IEvent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userData: { type: eventUserDataSchema, required: true },
    department: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: EVENT_TYPES,
      required: true,
      index: true,
    },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

eventSchema.index({ createdAt: -1 });
eventSchema.index({ department: 1, createdAt: -1 });
eventSchema.index({ userId: 1, createdAt: -1 });

/**
 * Event Mongoose model — append-only audit trail
 * @see IEvent
 */
export const Event: Model<IEvent> = getOrCreateModel<IEvent>(
  "Event",
  eventSchema,
  "events"
);
