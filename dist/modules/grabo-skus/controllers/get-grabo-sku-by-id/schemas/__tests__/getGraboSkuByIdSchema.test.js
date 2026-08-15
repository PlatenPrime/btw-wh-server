import { describe, expect, it } from "vitest";
import { getGraboSkuByIdSchema } from "../getGraboSkuByIdSchema.js";
describe("getGraboSkuByIdSchema", () => {
    it("accepts a valid ObjectId", () => {
        const result = getGraboSkuByIdSchema.safeParse({
            id: "000000000000000000000000",
        });
        expect(result.success).toBe(true);
    });
    it("rejects an invalid ObjectId", () => {
        expect(getGraboSkuByIdSchema.safeParse({ id: "bad-id" }).success).toBe(false);
    });
});
