import mongoose from "mongoose";
import { z } from "zod";
export const getAllEventsQuerySchema = z.object({
    page: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 1))
        .refine((val) => val > 0, "Page must be positive"),
    limit: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 20))
        .refine((val) => val > 0 && val <= 100, "Limit must be between 1 and 100"),
    department: z.string().trim().min(1).optional(),
    userId: z
        .string()
        .optional()
        .refine((val) => val === undefined || mongoose.Types.ObjectId.isValid(val), { message: "Invalid userId format" }),
    from: z
        .string()
        .optional()
        .refine((val) => val === undefined || !Number.isNaN(Date.parse(val)), {
        message: "Invalid from date",
    }),
    to: z
        .string()
        .optional()
        .refine((val) => val === undefined || !Number.isNaN(Date.parse(val)), {
        message: "Invalid to date",
    }),
});
