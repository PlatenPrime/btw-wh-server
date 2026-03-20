import { z } from "zod";

export const getAllSkusQuerySchema = z.object({
  konkName: z.string().optional(),
  prodName: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, "Page must be positive"),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 100, "Limit must be between 1 and 100"),
});

export type GetAllSkusQuery = z.infer<typeof getAllSkusQuerySchema>;
