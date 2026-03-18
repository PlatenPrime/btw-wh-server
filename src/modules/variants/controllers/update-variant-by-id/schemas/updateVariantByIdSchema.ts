import mongoose from "mongoose";
import { z } from "zod";

export const updateVariantByIdSchema = z
  .object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid variant ID format",
    }),
    konkName: z.string().min(1).optional(),
    prodName: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    url: z.string().min(1).optional(),
    varGroup: z
      .object({
        id: z.string().min(1, "varGroup.id is required"),
        title: z.string().min(1, "varGroup.title is required"),
      })
      .optional(),
    imageUrl: z.string().min(1).optional(),
  })
  .refine((data) => {
    const keys = Object.keys(data).filter((k) => k !== "id");
    return keys.some((k) => (data as Record<string, unknown>)[k] !== undefined);
  }, "At least one field must be provided for update");

export type UpdateVariantByIdInput = z.infer<typeof updateVariantByIdSchema>;

