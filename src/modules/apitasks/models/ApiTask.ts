import { Document, Model, Schema } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";
import {
  API_TASK_PHASES,
  API_TASK_STATUSES,
  type ApiTaskKind,
  type ApiTaskPhase,
  type ApiTaskStatus,
} from "../constants/apiTaskConstants.js";

export interface IApiTask extends Document {
  userId: string;
  kind: ApiTaskKind;
  params: Record<string, unknown>;
  resourceKey?: string;
  status: ApiTaskStatus;
  phase: ApiTaskPhase;
  progress: number;
  message?: string;
  result?: Record<string, unknown>;
  error?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const apiTaskSchema = new Schema<IApiTask>(
  {
    userId: { type: String, required: true, index: true },
    kind: { type: String, required: true },
    params: { type: Schema.Types.Mixed, default: () => ({}) },
    resourceKey: { type: String, index: true },
    status: {
      type: String,
      enum: API_TASK_STATUSES,
      default: "queued",
      index: true,
    },
    phase: {
      type: String,
      enum: API_TASK_PHASES,
      default: "queued",
    },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    message: { type: String },
    result: { type: Schema.Types.Mixed },
    error: { type: String },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

apiTaskSchema.index({ userId: 1, status: 1 });
apiTaskSchema.index({ kind: 1, resourceKey: 1, status: 1 });
apiTaskSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ApiTask: Model<IApiTask> = getOrCreateModel<IApiTask>(
  "ApiTask",
  apiTaskSchema,
  "apitasks",
);
