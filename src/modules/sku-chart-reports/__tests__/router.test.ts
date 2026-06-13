import { describe, expect, it } from "vitest";
import router from "../router.js";

describe("sku-chart-reports router", () => {
  it("registers expected GET routes", () => {
    const paths = (router.stack as Array<{ route?: { path: string } }>)
      .filter((layer) => layer.route)
      .map((layer) => layer.route!.path);

    expect(paths).toContain("/konk-prod/manufacturers-pie");
    expect(paths).toContain("/konk-prod/stock");
    expect(paths).toContain("/konk-prod/sales");
  });
});
