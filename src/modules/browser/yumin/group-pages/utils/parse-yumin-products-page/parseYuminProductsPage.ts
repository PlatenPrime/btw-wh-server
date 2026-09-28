import { z } from "zod";

export const yuminProductsPageSchema = z.object({
  data: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      url_key: z.string(),
      base_image: z
        .object({
          large_image_url: z.string().optional(),
          medium_image_url: z.string().optional(),
          original_image_url: z.string().optional(),
        })
        .nullable()
        .optional(),
    })
  ),
  links: z
    .object({
      next: z.string().nullable().optional(),
    })
    .optional(),
});

export function parseYuminProductsPage(raw: string, pageUrl: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error(`Invalid JSON in Yumin listing response: ${pageUrl}`);
  }
}
