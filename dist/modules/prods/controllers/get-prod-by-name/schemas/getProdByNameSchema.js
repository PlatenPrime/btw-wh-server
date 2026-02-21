import { z } from "zod";
export const getProdByNameSchema = z.object({
    name: z.string().min(1, "Name is required"),
});
