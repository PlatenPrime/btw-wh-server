import { describe, expect, it } from "vitest";
import router from "../router.js";

describe("sku-sales-reports router", () => {
  it("registers expected GET routes", () => {
    const paths = (router.stack as Array<{ route?: { path: string } }>)
      .filter((layer) => layer.route)
      .map((layer) => layer.route!.path);

    expect(paths).toContain("/konk-prod/skugr-groups-sales");
    expect(paths).toContain("/skugr/:skugrId/daily-summary");
    expect(paths).toContain("/sku/:skuId/by-date");
    expect(paths).toContain("/sku/:skuId/range");
  });
});
