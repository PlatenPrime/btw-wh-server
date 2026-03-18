import { z } from "zod";

export const createVariantSchema = z.object({
  konkName: z.string().min(1, "konkName is required"),
  prodName: z.string().min(1, "prodName is required"),
  title: z.string().min(1, "title is required"),
  url: z.string().min(1, "url is required"),
  varGroup: z
    .object({
      id: z.string().min(1, "varGroup.id is required"),
      title: z.string().min(1, "varGroup.title is required"),
    })
    .optional(),
  imageUrl: z.string().min(1, "imageUrl is required"),
});

export type CreateVariantInput = z.infer<typeof createVariantSchema>;
/** Input type for callers that may omit optional/default fields (e.g. tests) */
export type CreateVariantInputOptional = z.input<typeof createVariantSchema>;

