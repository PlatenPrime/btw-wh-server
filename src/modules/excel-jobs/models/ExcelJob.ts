import { Document, Model, Schema } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";
import {
  EXCEL_JOB_PHASES,
  EXCEL_JOB_STATUSES,
  type ExcelJobKind,
  type ExcelJobPhase,
  type ExcelJobStatus,
} from "../constants/excelJobConstants.js";

export interface IExcelJob extends Document {
  userId: string;
  kind: ExcelJobKind;
  params: Record<string, unknown>;
  status: ExcelJobStatus;
  phase: ExcelJobPhase;
  progress: number;
  fileName?: string;
  filePath?: string;
  sizeBytes?: number;
  error?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const excelJobSchema = new Schema<IExcelJob>(
  {
    userId: { type: String, required: true, index: true },
    kind: { type: String, required: true },
    params: { type: Schema.Types.Mixed, default: () => ({}) },
    status: {
      type: String,
      enum: EXCEL_JOB_STATUSES,
      default: "queued",
      index: true,
    },
    phase: {
      type: String,
      enum: EXCEL_JOB_PHASES,
      default: "queued",
    },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    fileName: { type: String },
    filePath: { type: String },
    sizeBytes: { type: Number },
    error: { type: String },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true },
);

excelJobSchema.index({ userId: 1, status: 1 });
excelJobSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ExcelJob: Model<IExcelJob> = getOrCreateModel<IExcelJob>(
  "ExcelJob",
  excelJobSchema,
  "exceljobs",
);
