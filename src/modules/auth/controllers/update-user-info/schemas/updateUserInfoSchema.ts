import mongoose from "mongoose";
import { z } from "zod";

export const updateUserInfoSchema = z.object({
  userId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid user ID format",
  }),
  password: z.string().optional(),
  fullname: z.string().optional(),
  role: z.string().optional(),
  telegram: z.string().optional(),
  photo: z.string().optional(),
});

export type UpdateUserInfoInput = z.infer<typeof updateUserInfoSchema>;

