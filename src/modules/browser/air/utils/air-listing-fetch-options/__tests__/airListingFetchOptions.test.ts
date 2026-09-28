import { describe, expect, it, vi } from "vitest";
import { airListingFetchOptions } from "../airListingFetchOptions.js";

vi.mock("../../getAirHttpProxyUrl.js", () => ({
  getAirHttpProxyUrl: vi.fn(() => undefined),
}));

describe("airListingFetchOptions", () => {
  it("sets Referer when warmUpUrl is present", () => {
    expect(airListingFetchOptions("https://air.ua/")).toEqual({
      konkName: "air",
      transport: "impit",
      proxyUrl: undefined,
      headers: {
        Referer: "https://air.ua/",
        "Sec-Fetch-Site": "same-origin",
      },
    });
  });

  it("omits headers when warmUpUrl is missing", () => {
    expect(airListingFetchOptions(undefined)).toEqual({
      konkName: "air",
      transport: "impit",
      proxyUrl: undefined,
    });
  });
});
