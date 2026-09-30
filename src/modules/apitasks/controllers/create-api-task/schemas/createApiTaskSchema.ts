import { z } from "zod";
import { isApiTaskKind } from "../../../constants/apiTaskConstants.js";

export const createApiTaskSchema = z.object({
  kind: z.string().refine(isApiTaskKind, { message: "Unknown api task kind" }),
  params: z.record(z.unknown()).optional().default({}),
});

export type CreateApiTaskInput = z.infer<typeof createApiTaskSchema>;
