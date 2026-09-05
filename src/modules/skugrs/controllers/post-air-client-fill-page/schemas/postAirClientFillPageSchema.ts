import mongoose from "mongoose";
import { z } from "zod";
import { AIR_CLIENT_SKUGR_HTML_MAX_CHARS } from "../../../constants/airClientSkugrFill.js";

export const postAirClientFillPageSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid skugr ID format",
  }),
  sourceUrl: z.string().url(),
  pageUrl: z.string().url(),
  html: z
    .string()
    .min(1, "html is required")
    .max(AIR_CLIENT_SKUGR_HTML_MAX_CHARS, "html exceeds maximum length"),
});

export type PostAirClientFillPageInput = z.infer<
  typeof postAirClientFillPageSchema
>;
