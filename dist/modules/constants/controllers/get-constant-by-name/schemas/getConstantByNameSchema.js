import { z } from "zod";
export const getConstantByNameSchema = z.object({
    name: z.string().min(1, "Name is required"),
});
