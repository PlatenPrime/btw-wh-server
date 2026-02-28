import { z } from "zod";
import { analogsPaginationQuerySchema } from "../../get-analogs/schemas/analogsPaginationQuerySchema.js";

export const getAnalogsByKonkSchema = z
  .object({
    konkName: z.string().min(1, "konkName is required"),
  })
  .merge(analogsPaginationQuerySchema);

export type GetAnalogsByKonkInput = z.infer<typeof getAnalogsByKonkSchema>;
