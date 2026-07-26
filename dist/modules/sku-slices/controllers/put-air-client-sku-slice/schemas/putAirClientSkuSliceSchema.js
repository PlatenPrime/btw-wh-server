import mongoose from "mongoose";
import { z } from "zod";
import { AIR_CLIENT_HTML_MAX_CHARS } from "../../../constants/airClientSlice.js";
export const putAirClientSkuSliceSchema = z.object({
    skuId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid sku ID format",
    }),
    sourceUrl: z.string().url(),
    html: z
        .string()
        .min(1, "html is required")
        .max(AIR_CLIENT_HTML_MAX_CHARS, "html exceeds maximum length"),
});
