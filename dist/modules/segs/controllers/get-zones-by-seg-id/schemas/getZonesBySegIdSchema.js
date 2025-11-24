import { z } from "zod";
import mongoose from "mongoose";
export const getZonesBySegIdSchema = z.object({
    segId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid segment ID format",
    }),
});
