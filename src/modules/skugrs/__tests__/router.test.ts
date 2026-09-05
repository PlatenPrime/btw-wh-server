import { describe, expect, it } from "vitest";
import router from "../router.js";

describe("skugrs router", () => {
  it("registers client air routes before generic id routes", () => {
    const paths = (router.stack as Array<{ route?: { path: string } }>)
      .filter((layer) => layer.route)
      .map((layer) => layer.route!.path);

    expect(paths).toContain("/client/air/pending");
    expect(paths).toContain("/client/air/id/:id/fill-page");
    expect(paths.indexOf("/client/air/pending")).toBeLessThan(
      paths.indexOf("/id/:id")
    );
  });
});
