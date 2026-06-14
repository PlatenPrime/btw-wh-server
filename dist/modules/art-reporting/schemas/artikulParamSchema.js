import { z } from "zod";
export const artikulParamSchema = z
    .string()
    .trim()
    .min(1, "artikul is required");
