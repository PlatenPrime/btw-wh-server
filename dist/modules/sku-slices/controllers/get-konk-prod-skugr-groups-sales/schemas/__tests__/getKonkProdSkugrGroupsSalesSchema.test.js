import { describe, expect, it } from "vitest";
import { konkProdRangeSchema } from "../../../common/schemas/konkProdRangeSchema.js";
import { getKonkProdSkugrGroupsSalesSchema } from "../getKonkProdSkugrGroupsSalesSchema.js";
describe("getKonkProdSkugrGroupsSalesSchema", () => {
    it("re-exports konkProdRangeSchema", () => {
        expect(getKonkProdSkugrGroupsSalesSchema).toBe(konkProdRangeSchema);
    });
});
