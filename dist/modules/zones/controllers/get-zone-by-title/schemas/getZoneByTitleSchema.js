import { z } from "zod";
export const getZoneByTitleSchema = z.object({
    title: z.string().trim().min(1, "Title is required"),
});
