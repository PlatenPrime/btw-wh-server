import { z } from "zod";

export const getAnalogsByKonkSchema = z.object({
  konkName: z.string().min(1, "konkName is required"),
});

export type GetAnalogsByKonkInput = z.infer<typeof getAnalogsByKonkSchema>;
