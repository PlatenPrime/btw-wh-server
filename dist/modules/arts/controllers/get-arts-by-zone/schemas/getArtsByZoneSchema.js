import { z } from "zod";
export const getArtsByZoneSchema = z.object({
    zone: z.string().min(1, "Zone is required"),
});
