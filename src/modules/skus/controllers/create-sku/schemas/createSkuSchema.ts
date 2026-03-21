import { z } from "zod";

const productIdSchema = z
  .string()
  .min(1, "ProductId is required")
  .regex(
    /^[a-z0-9_-]+-[A-Za-z0-9_-]+$/,
    "ProductId must be like konkName-rawId (e.g. air-12345)",
  );

export const createSkuSchema = z.object({
  konkName: z.string().min(1, "KonkName is required"),
  prodName: z.string().min(1, "ProdName is required"),
  productId: productIdSchema,
  btradeAnalog: z.string().default(""),
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Url must be a valid URL"),
  imageUrl: z.string().default(""),
});

export type CreateSkuInput = z.infer<typeof createSkuSchema>;
