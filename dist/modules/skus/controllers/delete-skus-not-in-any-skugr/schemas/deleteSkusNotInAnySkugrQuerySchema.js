import { getAllSkusQuerySchema } from "../../get-all-skus/schemas/getAllSkusQuerySchema.js";
/** Query для DELETE без пагинации; фильтр «сироты» задаётся в утилите принудительно. */
export const deleteSkusNotInAnySkugrQuerySchema = getAllSkusQuerySchema.omit({ page: true, limit: true });
