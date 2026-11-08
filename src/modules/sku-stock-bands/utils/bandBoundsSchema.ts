import { z } from "zod";

const stockBoundSchema = z.number().finite().nonnegative();

export const bandBoundsFieldsSchema = z
  .object({
    stockMin: stockBoundSchema,
    stockMax: stockBoundSchema,
    normalMax: stockBoundSchema,
  })
  .superRefine((data, ctx) => {
    if (data.stockMin > data.stockMax) {
      ctx.addIssue({
        code: "custom",
        message: "stockMin must be less than or equal to stockMax",
        path: ["stockMax"],
      });
    }
    if (!(data.normalMax < data.stockMin)) {
      ctx.addIssue({
        code: "custom",
        message: "normalMax must be less than stockMin",
        path: ["normalMax"],
      });
    }
  });
