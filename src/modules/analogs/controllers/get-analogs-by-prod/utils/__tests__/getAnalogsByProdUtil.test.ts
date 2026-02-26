import { beforeEach, describe, expect, it } from "vitest";
import { Analog } from "../../../../models/Analog.js";
import { getAnalogsByProdUtil } from "../getAnalogsByProdUtil.js";

describe("getAnalogsByProdUtil", () => {
  beforeEach(async () => {
    await Analog.deleteMany({});
  });

  it("returns analogs for given prodName", async () => {
    await Analog.create([
      { konkName: "k1", prodName: "maker", url: "https://a.com" },
      { konkName: "k2", prodName: "maker", url: "https://b.com" },
      { konkName: "k1", prodName: "other", url: "https://c.com" },
    ]);
    const result = await getAnalogsByProdUtil("maker");
    expect(result).toHaveLength(2);
    expect(result.every((a) => a.prodName === "maker")).toBe(true);
  });

  it("returns empty array when no analogs for prodName", async () => {
    const result = await getAnalogsByProdUtil("nonexistent");
    expect(result).toHaveLength(0);
  });
});
