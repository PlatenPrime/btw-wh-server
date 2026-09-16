import mongoose from "mongoose";
import { z } from "zod";
import { isExcelJobStatus } from "../../../constants/excelJobConstants.js";

export const getExcelJobSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid excel job ID format",
  }),
});

export type GetExcelJobInput = z.infer<typeof getExcelJobSchema>;

export const listExcelJobsSchema = z.object({
  status: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) return undefined;
      return value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
    })
    .refine(
      (values) => values === undefined || values.every(isExcelJobStatus),
      { message: "Invalid excel job status filter" },
    ),
});

export type ListExcelJobsInput = z.infer<typeof listExcelJobsSchema>;

export const downloadExcelJobFileSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid excel job ID format",
  }),
  token: z.string().min(1, "token is required"),
});

export type DownloadExcelJobFileInput = z.infer<typeof downloadExcelJobFileSchema>;
