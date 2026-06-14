import { artDateRangeFieldsSchema, artDateRangeRefine, } from "../../../../art-reporting/schemas/artDateRangeSchema.js";
import { artikulParamSchema } from "../../../../art-reporting/schemas/artikulParamSchema.js";
export const getArtStockChartDataSchema = artDateRangeFieldsSchema
    .extend({
    artikul: artikulParamSchema,
})
    .refine(artDateRangeRefine.check, {
    message: artDateRangeRefine.message,
    path: [artDateRangeRefine.path[0]],
});
