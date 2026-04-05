import { z } from "zod";
export const deleteKonkInvalidSkusParamsSchema = z.object({
    konkName: z.string().min(1, "konkName is required"),
});
