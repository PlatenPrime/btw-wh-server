import mongoose from "mongoose";
import { z } from "zod";
const objectIdSchema = z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format",
});
const palletDataSchema = z.object({
    _id: objectIdSchema,
    title: z.string().min(1),
});
const pullDetailsSchema = z
    .object({
    palletData: palletDataSchema,
    quant: z.number().min(0),
    boxes: z.number().min(0),
})
    .superRefine((value, ctx) => {
    if (value.quant === 0 && value.boxes === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["quant"],
            message: "At least one of quant or boxes must be greater than zero",
        });
    }
});
export const pullAskByIdSchema = z.object({
    id: objectIdSchema,
    solverId: objectIdSchema,
    action: z.string().min(1, "Action is required"),
    pullAskData: pullDetailsSchema,
});
