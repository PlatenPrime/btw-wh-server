import mongoose from "mongoose";
import { z } from "zod";
import { validAskStatuses } from "../../../models/Ask.js";
export const updateAskByIdSchema = z.object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid ask ID format",
    }),
    solverId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid solver ID format",
    }),
    action: z.string().min(1, "Action is required"),
    status: z
        .enum(validAskStatuses, {
        errorMap: () => ({
            message: "Invalid status. Must be one of: new, completed, rejected",
        }),
    })
        .optional(),
});
