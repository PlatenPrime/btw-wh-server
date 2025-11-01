import { z } from "zod";
import { createPosSchema } from "../../create-pos/schemas/createPosSchema.js";
export const bulkCreatePosesSchema = z.object({
    poses: z.array(createPosSchema).min(1, "At least one position is required"),
});
