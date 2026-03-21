import mongoose from "mongoose";
import { z } from "zod";
const objectIdString = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: "Invalid sku ID format" });
export const createSkugrSchema = z.object({
    konkName: z.string().min(1, "KonkName is required"),
    prodName: z.string().min(1, "ProdName is required"),
    title: z.string().min(1, "Title is required"),
    url: z.string().url("Url must be a valid URL"),
    skus: z.array(objectIdString).default([]),
});
