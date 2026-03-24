import { z } from "zod";

const productIdSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9_-]+-[A-Za-z0-9_-]+$/);

const optionalProductIdInUpdates = productIdSchema.optional();

const fixSkuFilterSchema = z
  .object({
    konkName: z.string().optional(),
    prodName: z.string().optional(),
    search: z.string().optional(),
    productId: productIdSchema.optional(),
    productIds: z.array(productIdSchema).min(1).optional(),
    btradeAnalog: z.string().optional(),
  })
  .strict()
  .superRefine((filter, ctx) => {
    const hasKonk =
      filter.konkName !== undefined && filter.konkName.trim() !== "";
    const hasProd =
      filter.prodName !== undefined && filter.prodName.trim() !== "";
    const hasSearch =
      filter.search !== undefined && filter.search.trim() !== "";
    const hasProductId = filter.productId !== undefined;
    const hasProductIds =
      filter.productIds !== undefined && filter.productIds.length > 0;
    const hasBtradeAnalog = filter.btradeAnalog !== undefined;

    if (
      !hasKonk &&
      !hasProd &&
      !hasSearch &&
      !hasProductId &&
      !hasProductIds &&
      !hasBtradeAnalog
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "At least one filter criterion is required (non-empty konkName, prodName, search, productId, productIds, or btradeAnalog)",
        path: [],
      });
    }
  });

const fixSkuUpdatesSchema = z
  .object({
    konkName: z.string().min(1).optional(),
    prodName: z.string().min(1).optional(),
    productId: optionalProductIdInUpdates,
    btradeAnalog: z.string().optional(),
    title: z.string().min(1).optional(),
    url: z.string().url("Url must be a valid URL").optional(),
    imageUrl: z.string().optional(),
  })
  .strict()
  .refine(
    (updates) => Object.keys(updates).length > 0,
    "At least one update field is required",
  );

export const fixIncorrectSkuDataSchema = z
  .object({
    filter: fixSkuFilterSchema,
    updates: fixSkuUpdatesSchema,
  })
  .strict();

export type FixIncorrectSkuDataInput = z.infer<typeof fixIncorrectSkuDataSchema>;
