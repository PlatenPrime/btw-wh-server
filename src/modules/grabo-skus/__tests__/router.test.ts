import { describe, expect, it } from "vitest";
import router from "../router.js";

describe("grabo-skus router", () => {
  it("registers list, by-id, sync and excel routes", () => {
    const paths = (router.stack as Array<{ route?: { path: string } }>)
      .filter((layer) => layer.route)
      .map((layer) => layer.route!.path);

    expect(paths).toContain("/");
    expect(paths).toContain("/id/:id");
    expect(paths).toContain("/sync");
    expect(paths).toContain("/excel");
  });
});
