import mongoose from "mongoose";
import { z } from "zod";
import { AIR_CLIENT_SKUGR_PRODUCTS_MAX } from "../../../constants/airClientSkugrFill.js";

const airClientFillPageProductSchema = z.object({
  productId: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  imageUrl: z.string().url(),
});

export const postAirClientFillPageSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid skugr ID format",
  }),
  sourceUrl: z.string().url(),
  pageUrl: z.string().url(),
  products: z
    .array(airClientFillPageProductSchema)
    .max(AIR_CLIENT_SKUGR_PRODUCTS_MAX, "too many products on page"),
  nextPageUrl: z.string().url().nullable(),
  hasListingMarkup: z.boolean(),
});

export type PostAirClientFillPageInput = z.infer<
  typeof postAirClientFillPageSchema
>;
