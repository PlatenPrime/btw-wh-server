import mongoose from "mongoose";
import { z } from "zod";
import { isApiTaskStatus } from "../../../constants/apiTaskConstants.js";

export const getApiTaskSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid api task ID format",
  }),
});

export type GetApiTaskInput = z.infer<typeof getApiTaskSchema>;

export const listApiTasksSchema = z.object({
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
      (values) => values === undefined || values.every(isApiTaskStatus),
      { message: "Invalid api task status filter" },
    ),
});

export type ListApiTasksInput = z.infer<typeof listApiTasksSchema>;
