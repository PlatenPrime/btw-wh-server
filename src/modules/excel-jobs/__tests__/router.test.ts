import { describe, expect, it } from "vitest";
import router from "../router.js";

describe("excel-jobs router", () => {
  it("registers job routes", () => {
    const paths = (router.stack as Array<{ route?: { path: string; methods: Record<string, boolean> } }>)
      .filter((layer) => layer.route)
      .map((layer) => `${Object.keys(layer.route!.methods)[0]} ${layer.route!.path}`);

    expect(paths).toContain("post /");
    expect(paths).toContain("get /");
    expect(paths).toContain("get /:id/file");
    expect(paths).toContain("get /:id");
    expect(paths).toContain("delete /:id");
  });
});
