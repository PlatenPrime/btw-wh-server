import { describe, expect, it, vi } from "vitest";
import { fetchPageHtml } from "../../../../utils/fetchPageHtml.js";
import { AIR_SERVER_IDLE_CODE } from "../../../utils/airServerIdleError.js";

vi.mock("../../../utils/airIdleMode.js", () => ({ AIR_IDLE_MODE: true }));
vi.mock("../../../../utils/fetchPageHtml.js");
vi.mock("../../../../../../logging/createLogger.js", () => ({
  createLogger: () => ({
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { getAirGroupPagesProducts } from "../getAirGroupPagesProducts.js";

describe("getAirGroupPagesProducts — AIR_IDLE_MODE", () => {
  it("throws AirServerIdleError without network", async () => {
    await expect(
      getAirGroupPagesProducts({
        groupUrl: "https://airballoons.com.ua/ua/category",
        maxPages: 1,
      })
    ).rejects.toMatchObject({
      name: "AirServerIdleError",
      code: AIR_SERVER_IDLE_CODE,
    });
    expect(fetchPageHtml).not.toHaveBeenCalled();
  });
});
