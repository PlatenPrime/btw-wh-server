import { z } from "zod";

export const getZoneByTitleSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
});

export type GetZoneByTitleInput = z.infer<typeof getZoneByTitleSchema>;
