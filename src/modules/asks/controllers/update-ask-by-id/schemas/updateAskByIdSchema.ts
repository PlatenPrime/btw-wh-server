import mongoose from "mongoose";
import { z } from "zod";
import { AskStatus, validAskStatuses } from "../../../models/Ask.js";

const askEventNames = ["create", "complete", "reject", "pull"] as const;

const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format",
  });

const palletDataSchema = z.object({
  _id: objectIdSchema,
  title: z.string().min(1),
  sector: z.string().optional(),
  isDef: z.boolean().optional(),
});

const pullDetailsSchema = z.object({
  palletData: palletDataSchema,
  quant: z.number().min(0),
  boxes: z.number().min(0),
});

const askEventPayloadSchema = z
  .object({
    eventName: z.enum(askEventNames),
    date: z.string().datetime().optional(),
    pullDetails: pullDetailsSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.eventName === "pull" && !value.pullDetails) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pullDetails"],
        message: "pullDetails is required for pull events",
      });
    }
    if (value.eventName !== "pull" && value.pullDetails) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pullDetails"],
        message: "pullDetails must be omitted for non-pull events",
      });
    }
  });

export const updateAskByIdSchema = z.object({
  id: objectIdSchema,
  solverId: objectIdSchema,
  action: z.string().min(1, "Action is required"),
  status: z
    .enum(validAskStatuses as [AskStatus, ...AskStatus[]], {
      errorMap: () => ({
        message: "Invalid status. Must be one of: new, completed, rejected",
      }),
    })
    .optional(),
  event: askEventPayloadSchema.optional(),
});

export type UpdateAskByIdInput = z.infer<typeof updateAskByIdSchema>;
export type UpdateAskEventPayload = z.infer<typeof askEventPayloadSchema>;
