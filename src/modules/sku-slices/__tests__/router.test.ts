import { describe, expect, it } from "vitest";
import router from "../router.js";

describe("sku-slices router", () => {
  it("registers expected GET routes", () => {
    const paths = (router.stack as Array<{ route?: { path: string } }>)
      .filter((layer) => layer.route)
      .map((layer) => layer.route!.path);

    expect(paths).toEqual(["/", "/sku/:skuId/range", "/sku/:skuId"]);
  });
});
