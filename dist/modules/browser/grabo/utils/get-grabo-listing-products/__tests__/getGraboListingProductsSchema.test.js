import { describe, expect, it } from "vitest";
import { GRABO_LISTING_DEFAULT_MAX_PAGES, getGraboListingProductsSchema, } from "../getGraboListingProductsSchema.js";
describe("getGraboListingProductsSchema", () => {
    it("defaults max pages to 100", () => {
        expect(GRABO_LISTING_DEFAULT_MAX_PAGES).toBe(100);
    });
    it("accepts valid groupUrl", () => {
        const result = getGraboListingProductsSchema.safeParse({
            groupUrl: "https://www.grabo-balloons.com/en/non-message",
        });
        expect(result.success).toBe(true);
    });
    it("rejects missing or invalid groupUrl", () => {
        expect(getGraboListingProductsSchema.safeParse({}).success).toBe(false);
        expect(getGraboListingProductsSchema.safeParse({ groupUrl: "not-a-url" }).success).toBe(false);
    });
    it("rejects maxPages outside 1..200", () => {
        expect(getGraboListingProductsSchema.safeParse({
            groupUrl: "https://www.grabo-balloons.com/en/party",
            maxPages: 0,
        }).success).toBe(false);
        expect(getGraboListingProductsSchema.safeParse({
            groupUrl: "https://www.grabo-balloons.com/en/party",
            maxPages: 201,
        }).success).toBe(false);
    });
});
