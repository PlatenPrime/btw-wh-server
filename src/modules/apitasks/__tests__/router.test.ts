import { describe, expect, it } from "vitest";
import router from "../router.js";

describe("apitasks router", () => {
  it("exports an express router", () => {
    expect(router).toBeTruthy();
    expect(typeof router).toBe("function");
  });
});
