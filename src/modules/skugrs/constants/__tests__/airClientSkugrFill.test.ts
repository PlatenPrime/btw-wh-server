import { describe, expect, it } from "vitest";
import {
  AIR_CLIENT_SKUGR_HTML_MAX_CHARS,
  AIR_CLIENT_SKUGR_KONK,
} from "../airClientSkugrFill.js";

describe("airClientSkugrFill constants", () => {
  it("pins konk and html cap", () => {
    expect(AIR_CLIENT_SKUGR_KONK).toBe("air");
    expect(AIR_CLIENT_SKUGR_HTML_MAX_CHARS).toBe(2_000_000);
  });
});
