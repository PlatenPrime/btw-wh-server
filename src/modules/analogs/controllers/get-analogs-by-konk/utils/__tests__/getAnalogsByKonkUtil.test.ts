import { beforeEach, describe, expect, it } from "vitest";
import { Analog } from "../../../../models/Analog.js";
import { getAnalogsByKonkUtil } from "../getAnalogsByKonkUtil.js";

describe("getAnalogsByKonkUtil", () => {
  beforeEach(async () => {
    await Analog.deleteMany({});
  });

  it("returns analogs for given konkName", async () => {
    await Analog.create([
      { konkName: "acme", prodName: "p1", url: "https://a.com" },
      { konkName: "acme", prodName: "p2", url: "https://b.com" },
      { konkName: "other", prodName: "p1", url: "https://c.com" },
    ]);
    const result = await getAnalogsByKonkUtil("acme");
    expect(result).toHaveLength(2);
    expect(result.every((a) => a.konkName === "acme")).toBe(true);
  });

  it("returns empty array when no analogs for konkName", async () => {
    const result = await getAnalogsByKonkUtil("nonexistent");
    expect(result).toHaveLength(0);
  });
});
