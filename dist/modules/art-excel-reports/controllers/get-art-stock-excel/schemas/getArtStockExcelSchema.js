import { artDateRangeFieldsSchema, artDateRangeRefine, } from "../../../../art-reporting/schemas/artDateRangeSchema.js";
import { artikulParamSchema } from "../../../../art-reporting/schemas/artikulParamSchema.js";
export const getArtStockExcelSchema = artDateRangeFieldsSchema
    .extend({
    artikul: artikulParamSchema,
})
    .refine(artDateRangeRefine.check, {
    message: artDateRangeRefine.message,
    path: [artDateRangeRefine.path[0]],
});
