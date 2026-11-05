import mongoose from "mongoose";
import { z } from "zod";

const objectIdString = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: "Invalid sku ID format",
});

const optionalTrimmedString = z.preprocess((val) => {
  if (val === undefined || val === null) return undefined;
  if (typeof val !== "string") return val;
  const trimmed = val.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().optional());

/**
 * Режим A: непорожній `skuIds` без `selectAll`.
 * Режим B: `selectAll: true` + опційні фільтри каталогу, без `skuIds`.
 */
export const skuSelectionResolveFieldsSchema = z
  .object({
    skuIds: z.array(objectIdString).min(1).optional(),
    /** Только `true` включает режим B; `false`/відсутність = режим A при наявності skuIds. */
    selectAll: z.boolean().optional(),
    search: optionalTrimmedString,
    konkName: optionalTrimmedString,
    prodName: optionalTrimmedString,
  })
  .superRefine((data, ctx) => {
    const hasSkuIds = data.skuIds !== undefined;
    const selectAll = data.selectAll === true;

    if (selectAll && hasSkuIds) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "skuIds is not allowed with selectAll",
        path: ["skuIds"],
      });
      return;
    }

    if (selectAll === hasSkuIds) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide either non-empty skuIds or selectAll: true (not both, not neither)",
        path: selectAll || hasSkuIds ? ["skuIds"] : ["selectAll"],
      });
    }
  });

export type SkuSelectionResolveFields = z.infer<typeof skuSelectionResolveFieldsSchema>;
