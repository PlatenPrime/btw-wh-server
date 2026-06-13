import { describe, expect, it } from "vitest";
import router from "../router.js";

describe("sku-excel-reports router", () => {
  it("registers expected GET routes", () => {
    const paths = (router.stack as Array<{ route?: { path: string } }>)
      .filter((layer) => layer.route)
      .map((layer) => layer.route!.path);

    expect(paths).toContain("/catalog/new-since");
    expect(paths).toContain("/catalog/invalid");
    expect(paths).toContain("/konk/stock");
    expect(paths).toContain("/konk/sales");
    expect(paths).toContain("/skugr/:skugrId/stock");
    expect(paths).toContain("/skugr/:skugrId/sales");
    expect(paths).toContain("/sku/:skuId/stock");
    expect(paths).toContain("/sku/:skuId/sales");
  });
});
