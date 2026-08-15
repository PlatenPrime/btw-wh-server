import { describe, expect, it } from "vitest";
import { GRABO_SKU_EXCEL_COLUMNS } from "../graboSkuExcelColumns.js";
describe("GRABO_SKU_EXCEL_COLUMNS", () => {
    it("lists model field names without mongo id", () => {
        expect(GRABO_SKU_EXCEL_COLUMNS).toEqual([
            "productId",
            "title",
            "url",
            "isNewProduct",
            "color",
            "size",
            "material",
            "gas",
            "language",
            "gasCapacity",
            "tags",
            "images",
            "isOnSite",
            "lastSeenAt",
            "createdAt",
            "updatedAt",
        ]);
        expect(GRABO_SKU_EXCEL_COLUMNS).not.toContain("_id");
        expect(GRABO_SKU_EXCEL_COLUMNS).not.toContain("__v");
    });
});
