import { describe, expect, it } from "vitest";
import router from "../router.js";

describe("sku-slices router", () => {
  it("registers expected routes", () => {
    const paths = (router.stack as Array<{ route?: { path: string } }>)
      .filter((layer) => layer.route)
      .map((layer) => layer.route!.path);

    expect(paths).toEqual([
      "/",
      "/day-status",
      "/day-invalid",
      "/client/air/pending",
      "/client/air/sku/:skuId",
      "/pack-flips",
      "/skugr/:skugrId/run-today",
      "/post-corrections/run",
      "/sku/:skuId/range",
      "/sku/:skuId",
      "/sku/:skuId",
    ]);
  });
});
