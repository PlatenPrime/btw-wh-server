import { z } from "zod";

export const createUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  fullname: z.string().min(1, "Fullname is required"),
  role: z.string().optional(),
  telegram: z.string().optional(),
  photo: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
