import { z } from "zod";

export const getArtsByZoneSchema = z.object({
  zone: z.string().min(1, "Zone is required"),
});

export type GetArtsByZoneInput = z.infer<typeof getArtsByZoneSchema>;

