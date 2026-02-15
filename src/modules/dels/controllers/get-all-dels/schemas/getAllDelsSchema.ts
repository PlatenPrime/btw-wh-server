import { z } from "zod";

export const getAllDelsSchema = z.object({});

export type GetAllDelsInput = z.infer<typeof getAllDelsSchema>;
