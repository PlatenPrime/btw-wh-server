import { z } from "zod";

/**
 * Schema for get pulls endpoint
 * Currently empty, but can be extended for future filters/pagination
 */
export const getPullsSchema = z.object({});

export type GetPullsInput = z.infer<typeof getPullsSchema>;
