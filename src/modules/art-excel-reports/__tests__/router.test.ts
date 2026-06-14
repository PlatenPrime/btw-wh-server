import { describe, expect, it } from "vitest";
import router from "../router.js";

describe("art-excel-reports router", () => {
  it("registers expected GET routes", () => {
    const paths = (router.stack as Array<{ route?: { path: string } }>)
      .filter((layer) => layer.route)
      .map((layer) => layer.route!.path);

    expect(paths).toContain("/artikul/:artikul/stock");
    expect(paths).toContain("/artikul/:artikul/sales");
  });
});
