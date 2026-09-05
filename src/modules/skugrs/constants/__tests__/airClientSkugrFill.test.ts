import { describe, expect, it } from "vitest";
import {
  AIR_CLIENT_SKUGR_KONK,
  AIR_CLIENT_SKUGR_PRODUCTS_MAX,
} from "../airClientSkugrFill.js";

describe("airClientSkugrFill constants", () => {
  it("pins konk and products cap", () => {
    expect(AIR_CLIENT_SKUGR_KONK).toBe("air");
    expect(AIR_CLIENT_SKUGR_PRODUCTS_MAX).toBe(200);
  });
});
