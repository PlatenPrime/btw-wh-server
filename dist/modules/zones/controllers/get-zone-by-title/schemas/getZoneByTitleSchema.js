import { z } from "zod";
export const getZoneByTitleSchema = z.object({
    title: z.string().min(1, "Title is required"),
});
